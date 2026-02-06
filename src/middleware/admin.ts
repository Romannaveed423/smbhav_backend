import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { User } from '../models/User';
import { createError } from '../utils/errors';

export interface AdminRequest extends AuthRequest {
  admin?: {
    id: string;
    email: string;
  };
}

/**
 * Middleware to check if the authenticated user is an admin
 */
export const requireAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First ensure user is authenticated
    if (!req.user) {
      throw createError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw createError('User not found', 404, 'NOT_FOUND');
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      throw createError('Admin access required', 403, 'FORBIDDEN');
    }

    req.admin = {
      id: user._id.toString(),
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

