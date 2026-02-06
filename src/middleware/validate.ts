import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        console.error('❌ [Validation] Validation failed:', JSON.stringify(errors, null, 2));
        console.error('❌ [Validation] Request body:', JSON.stringify(req.body, null, 2));
        next(createError('Validation error', 400, 'VALIDATION_ERROR', errors));
      } else {
        next(error);
      }
    }
  };
};

