import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Referral } from '../models/Referral';
import { Earning } from '../models/Earning';
import { createError } from '../utils/errors';
import mongoose from 'mongoose';
import { env } from '../config/env';

/**
 * Get user's referral dashboard with stats
 */
export const getReferralDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404, 'NOT_FOUND');
    }

    // Get referral stats
    const referrals = await Referral.find({ referrerId: new mongoose.Types.ObjectId(userId) })
      .populate('referredUserId', 'name email phone createdAt')
      .sort({ createdAt: -1 });

    // Get total commission earnings
    const [totalCommissions, thisMonthCommissions] = await Promise.all([
      Earning.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            isReferralCommission: true,
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Earning.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            isReferralCommission: true,
            status: 'completed',
            earnedAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    // Generate referral link
    const referralLink = `${env.baseUrl}/register?ref=${user.referralCode}`;

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink,
        stats: {
          totalReferrals: user.totalReferrals,
          activeReferrals: user.activeReferrals,
          totalCommissions: totalCommissions[0]?.total || 0,
          thisMonthCommissions: thisMonthCommissions[0]?.total || 0,
          referralEarnings: user.referralEarnings,
          commissionRate: env.referralCommissionRate * 100, // Convert to percentage
        },
        referrals: referrals.map((ref) => ({
          id: ref._id.toString(),
          referredUser: {
            id: (ref.referredUserId as any)._id.toString(),
            name: (ref.referredUserId as any).name,
            email: (ref.referredUserId as any).email,
            phone: (ref.referredUserId as any).phone,
            joinedAt: (ref.referredUserId as any).createdAt,
          },
          status: ref.status,
          totalCommissions: ref.totalCommissions,
          lastCommissionAt: ref.lastCommissionAt || null,
          createdAt: ref.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed referral list with pagination
 */
export const getReferrals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      referrerId: new mongoose.Types.ObjectId(userId),
    };

    if (status) {
      query.status = status;
    }

    const [referrals, total] = await Promise.all([
      Referral.find(query)
        .populate('referredUserId', 'name email phone profileImage createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Referral.countDocuments(query),
    ]);

    // Get commission details for each referral
    const referralsWithCommissions = await Promise.all(
      referrals.map(async (ref) => {
        const commissions = await Earning.find({
          isReferralCommission: true,
          referredUserId: ref.referredUserId,
          status: 'completed',
        })
          .populate('productId', 'name')
          .sort({ earnedAt: -1 })
          .limit(5);

        return {
          id: ref._id.toString(),
          referredUser: {
            id: (ref.referredUserId as any)._id.toString(),
            name: (ref.referredUserId as any).name,
            email: (ref.referredUserId as any).email,
            phone: (ref.referredUserId as any).phone,
            profileImage: (ref.referredUserId as any).profileImage || null,
            joinedAt: (ref.referredUserId as any).createdAt,
          },
          status: ref.status,
          totalCommissions: ref.totalCommissions,
          lastCommissionAt: ref.lastCommissionAt || null,
          recentCommissions: commissions.map((comm) => ({
            id: comm._id.toString(),
            productName: (comm.productId as any)?.name || 'N/A',
            amount: comm.amount,
            earnedAt: comm.earnedAt,
          })),
          createdAt: ref.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: {
        referrals: referralsWithCommissions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral commission earnings
 */
export const getReferralCommissions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      isReferralCommission: true,
    };

    if (startDate || endDate) {
      query.earnedAt = {};
      if (startDate) query.earnedAt.$gte = new Date(startDate as string);
      if (endDate) query.earnedAt.$lte = new Date(endDate as string);
    }

    const [commissions, total] = await Promise.all([
      Earning.find(query)
        .populate('productId', 'name')
        .populate('referredUserId', 'name email')
        .sort({ earnedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Earning.countDocuments(query),
    ]);

    // Calculate summary
    const [totalCommissions, thisMonthCommissions] = await Promise.all([
      Earning.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            isReferralCommission: true,
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Earning.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            isReferralCommission: true,
            status: 'completed',
            earnedAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        commissions: commissions.map((comm) => ({
          id: comm._id.toString(),
          productName: (comm.productId as any)?.name || 'N/A',
          referredUser: comm.referredUserId
            ? {
                id: (comm.referredUserId as any)._id.toString(),
                name: (comm.referredUserId as any).name,
                email: (comm.referredUserId as any).email,
              }
            : null,
          amount: comm.amount,
          commissionRate: comm.referralCommissionRate ? comm.referralCommissionRate * 100 : null,
          earnedAt: comm.earnedAt,
          status: comm.status,
        })),
        summary: {
          totalCommissions: totalCommissions[0]?.total || 0,
          thisMonthCommissions: thisMonthCommissions[0]?.total || 0,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify if a referral code is valid
 */
export const verifyReferralCode = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      throw createError('Referral code is required', 400, 'VALIDATION_ERROR');
    }

    const referrer = await User.findOne({ referralCode: code.toUpperCase() });
    if (!referrer) {
      throw createError('Invalid referral code', 404, 'INVALID_REFERRAL_CODE');
    }

    res.json({
      success: true,
      data: {
        valid: true,
        referrerName: referrer.name,
        referralCode: referrer.referralCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

