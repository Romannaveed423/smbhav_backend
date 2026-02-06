import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { config } from '../config/env';
import mongoose from 'mongoose';

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle known application errors
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.originalUrl,
      method: req.method,
      stack: config.nodeEnv === 'development' ? err.stack : undefined,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(config.nodeEnv === 'development' && {
        path: req.originalUrl,
        method: req.method,
      }),
    });
    return;
  }

  // Handle MongoDB validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const validationError = err as mongoose.Error.ValidationError;
    const messages = Object.values(validationError.errors).map(
      (e) => e.message
    );
    logger.error('MongoDB Validation Error:', {
      errors: messages,
      path: req.originalUrl,
      method: req.method,
    });

    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages,
    });
    return;
  }

  // Handle MongoDB cast errors (invalid ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    logger.error('MongoDB Cast Error:', {
      error: err.message,
      path: req.originalUrl,
      method: req.method,
    });

    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
    return;
  }

  // Handle duplicate key errors (MongoDB E11000)
  if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
    const mongoError = err as { code: number; keyPattern?: Record<string, unknown>; keyValue?: Record<string, unknown> };
    const field = mongoError.keyPattern ? Object.keys(mongoError.keyPattern)[0] : 'field';
    const value = mongoError.keyValue ? Object.values(mongoError.keyValue)[0] : undefined;
    
    logger.error('MongoDB Duplicate Key Error:', {
      field,
      value,
      path: req.originalUrl,
      method: req.method,
    });

    res.status(409).json({
      success: false,
      message: `${field} already exists${value ? `: ${value}` : ''}`,
    });
    return;
  }

  // Handle unexpected errors
  logger.error('Unexpected error:', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    body: config.nodeEnv === 'development' ? req.body : undefined,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(config.nodeEnv === 'development' && {
      error: err.message,
      stack: err.stack,
      path: req.originalUrl,
    }),
  });
};

/**
 * 404 Not Found handler middleware
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    ...(config.nodeEnv === 'development' && {
      method: req.method,
      path: req.originalUrl,
    }),
  });
};

