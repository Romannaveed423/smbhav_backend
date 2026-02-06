import { Response, NextFunction } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError } from '../utils/errors';

export const getBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: {
        balance: user.walletBalance,
        totalEarnings: user.totalEarnings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query: any = { userId: req.user?.userId };

    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEarnings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayEarnings, weekEarnings, monthEarnings] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: { $in: ['lead_commission', 'referral_bonus', 'bonus_campaign'] },
            status: 'completed',
            createdAt: { $gte: today },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: { $in: ['lead_commission', 'referral_bonus', 'bonus_campaign'] },
            status: 'completed',
            createdAt: { $gte: weekStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: { $in: ['lead_commission', 'referral_bonus', 'bonus_campaign'] },
            status: 'completed',
            createdAt: { $gte: monthStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        lifetime: user.totalEarnings,
        today: todayEarnings[0]?.total || 0,
        week: weekEarnings[0]?.total || 0,
        month: monthEarnings[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

