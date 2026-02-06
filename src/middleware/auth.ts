import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { createError } from '../utils/errors';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    role: string;
    id: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as JWTPayload;

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw createError('User not found', 401, 'UNAUTHORIZED');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

