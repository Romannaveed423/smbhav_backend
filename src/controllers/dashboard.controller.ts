import { Response, NextFunction } from 'express';
import User from '../models/User';
import Lead from '../models/Lead';
import Transaction from '../models/Transaction';
import Referral from '../models/Referral';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError } from '../utils/errors';
import { LEAD_STATUS } from '../utils/constants';

export const getDashboard = async (
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

    // Earnings
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

    // Leads
    const [totalLeads, leadsByStatus, monthLeads] = await Promise.all([
      Lead.countDocuments({ agentId: user._id }),
      Lead.aggregate([
        { $match: { agentId: user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Lead.countDocuments({
        agentId: user._id,
        createdAt: { $gte: monthStart },
      }),
    ]);

    const leadsStatusMap: Record<string, number> = {};
    leadsByStatus.forEach((item) => {
      leadsStatusMap[item._id] = item.count;
    });

    // Referrals
    const [totalReferrals, referralEarnings] = await Promise.all([
      Referral.countDocuments({ referrerId: user._id }),
      Referral.aggregate([
        { $match: { referrerId: user._id } },
        { $group: { _id: null, total: { $sum: '$totalEarnings' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        earnings: {
          lifetime: user.totalEarnings,
          today: todayEarnings[0]?.total || 0,
          week: weekEarnings[0]?.total || 0,
          month: monthEarnings[0]?.total || 0,
          walletBalance: user.walletBalance,
        },
        leads: {
          total: totalLeads,
          thisMonth: monthLeads,
          byStatus: leadsStatusMap,
        },
        sales: {
          total: user.totalSales,
        },
        referrals: {
          total: totalReferrals,
          earnings: referralEarnings[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

