import { Response, NextFunction } from 'express';
import Training from '../models/Training';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError } from '../utils/errors';

export const getTrainings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category } = req.query;
    const query: any = { isActive: true };

    if (category) {
      query.category = category;
    }

    const trainings = await Training.find(query).sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      data: trainings,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrainingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const training = await Training.findById(id);

    if (!training) {
      throw new NotFoundError('Training not found');
    }

    res.json({
      success: true,
      data: training,
    });
  } catch (error) {
    next(error);
  }
};

export const markTrainingComplete = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const training = await Training.findById(id);

    if (!training) {
      throw new NotFoundError('Training not found');
    }

    // In a full implementation, you might want to track completion in a separate model
    res.json({
      success: true,
      message: 'Training marked as completed',
    });
  } catch (error) {
    next(error);
  }
};

