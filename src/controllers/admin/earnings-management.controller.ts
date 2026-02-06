import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../middleware/admin';
import { Earning } from '../../models/Earning';
import { User } from '../../models/User';
import { ClickLog } from '../../models/ClickLog';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * List Earnings (Admin)
 */
export const listEarnings = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, type, productId, userId, approvalStatus, startDate, endDate, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    // Apply filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (productId) query.productId = new mongoose.Types.ObjectId(productId as string);
    if (userId) query.userId = new mongoose.Types.ObjectId(userId as string);
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (startDate || endDate) {
      query.earnedAt = {};
      if (startDate) query.earnedAt.$gte = new Date(startDate as string);
      if (endDate) query.earnedAt.$lte = new Date(endDate as string);
    }
    if (search) {
      query.$or = [
        { conversionId: { $regex: search as string, $options: 'i' } },
        { clickId: { $regex: search as string, $options: 'i' } },
      ];
    }

    const [earnings, total] = await Promise.all([
      Earning.find(query)
        .populate('userId', 'name email phone')
        .populate('productId', 'name category')
        .populate('offerId', 'name amount')
        .populate('approvedBy', 'name email')
        .sort({ earnedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Earning.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        earnings: earnings.map((earning) => ({
          id: earning._id.toString(),
          conversionId: earning.conversionId,
          clickId: earning.clickId,
          user: earning.userId ? {
            id: (earning.userId as any)._id.toString(),
            name: (earning.userId as any).name,
            email: (earning.userId as any).email,
            phone: (earning.userId as any).phone,
          } : null,
          product: earning.productId ? {
            id: (earning.productId as any)._id.toString(),
            name: (earning.productId as any).name,
            category: (earning.productId as any).category,
          } : null,
          offer: earning.offerId ? {
            id: (earning.offerId as any)._id.toString(),
            name: (earning.offerId as any).name,
            amount: (earning.offerId as any).amount,
          } : null,
          amount: earning.amount,
          status: earning.status,
          type: earning.type,
          approvalStatus: earning.approvalStatus,
          approvedBy: earning.approvedBy ? {
            id: (earning.approvedBy as any)._id.toString(),
            name: (earning.approvedBy as any).name,
            email: (earning.approvedBy as any).email,
          } : null,
          approvedAt: earning.approvedAt,
          rejectionReason: earning.rejectionReason,
          postbackReceived: earning.postbackReceived,
          postbackReceivedAt: earning.postbackReceivedAt,
          isReferralCommission: earning.isReferralCommission,
          earnedAt: earning.earnedAt,
          creditedAt: earning.creditedAt,
          createdAt: earning.createdAt,
          updatedAt: earning.updatedAt,
        })),
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
 * Get Single Earning (Admin)
 */
export const getEarning = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { earningId } = req.params;

    // Validate that earningId is a valid MongoDB ObjectId
    // This prevents reserved routes like "tasks-approval" from being treated as IDs
    if (!mongoose.Types.ObjectId.isValid(earningId)) {
      throw createError(`Invalid earning ID: "${earningId}" is not a valid ObjectId`, 400, 'INVALID_ID');
    }

    const earning = await Earning.findById(earningId)
      .populate('userId', 'name email phone')
      .populate('productId', 'name category')
      .populate('offerId', 'name amount')
      .populate('approvedBy', 'name email')
      .populate('referrerId', 'name email');

    if (!earning) {
      throw createError('Earning not found', 404, 'NOT_FOUND');
    }

    // Get click log if exists
    let clickLog = null;
    if (earning.clickId) {
      clickLog = await ClickLog.findOne({ clickId: earning.clickId });
    }

    res.json({
      success: true,
      data: {
        id: earning._id.toString(),
        conversionId: earning.conversionId,
        clickId: earning.clickId,
        user: earning.userId ? {
          id: (earning.userId as any)._id.toString(),
          name: (earning.userId as any).name,
          email: (earning.userId as any).email,
          phone: (earning.userId as any).phone,
        } : null,
        product: earning.productId ? {
          id: (earning.productId as any)._id.toString(),
          name: (earning.productId as any).name,
          category: (earning.productId as any).category,
        } : null,
        offer: earning.offerId ? {
          id: (earning.offerId as any)._id.toString(),
          name: (earning.offerId as any).name,
          amount: (earning.offerId as any).amount,
        } : null,
        amount: earning.amount,
        status: earning.status,
        type: earning.type,
        approvalStatus: earning.approvalStatus,
        approvedBy: earning.approvedBy ? {
          id: (earning.approvedBy as any)._id.toString(),
          name: (earning.approvedBy as any).name,
          email: (earning.approvedBy as any).email,
        } : null,
        approvedAt: earning.approvedAt,
        rejectionReason: earning.rejectionReason,
        postbackReceived: earning.postbackReceived,
        postbackReceivedAt: earning.postbackReceivedAt,
        postbackData: earning.postbackData,
        isReferralCommission: earning.isReferralCommission,
        referrer: earning.referrerId ? {
          id: (earning.referrerId as any)._id.toString(),
          name: (earning.referrerId as any).name,
          email: (earning.referrerId as any).email,
        } : null,
        clickLog: clickLog ? {
          clickedAt: clickLog.clickedAt,
          ipAddress: clickLog.ipAddress,
          userAgent: clickLog.userAgent,
          status: clickLog.status,
        } : null,
        earnedAt: earning.earnedAt,
        creditedAt: earning.creditedAt,
        createdAt: earning.createdAt,
        updatedAt: earning.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve Earning (Admin)
 */
export const approveEarning = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { earningId } = req.params;
    const { amount, notes } = req.body;
    const adminId = req.admin?.id;

    if (!adminId) {
      throw createError('Admin authentication required', 401, 'UNAUTHORIZED');
    }

    const earning = await Earning.findById(earningId).populate('userId');

    if (!earning) {
      throw createError('Earning not found', 404, 'NOT_FOUND');
    }

    if (earning.approvalStatus === 'manually_approved') {
      throw createError('Earning already approved', 400, 'ALREADY_PROCESSED');
    }

    const userId = earning.userId as any;
    
    // Override amount if provided
    if (amount && Number(amount) > 0) {
      earning.amount = Number(amount);
    }

    earning.approvalStatus = 'manually_approved';
    earning.status = 'completed';
    earning.approvedBy = new mongoose.Types.ObjectId(adminId);
    earning.approvedAt = new Date();
    earning.creditedAt = new Date();

    if (notes) {
      earning.postbackData = {
        ...earning.postbackData,
        adminNotes: notes,
      };
    }

    // Credit wallet
    await User.findByIdAndUpdate(userId._id, {
      $inc: {
        walletBalance: earning.amount,
        totalEarnings: earning.amount,
      },
    });

    // Process referral commission if applicable
    if (!earning.isReferralCommission) {
      // Import the referral commission function
      const { Referral } = await import('../../models/Referral');
      const { env } = await import('../../config/env');
      
      const referredUser = await User.findById(userId._id);
      if (referredUser?.referredBy) {
        const referral = await Referral.findOne({
          referredUserId: referredUser._id,
          referrerId: referredUser.referredBy,
        });
        
        if (referral) {
          const commissionRate = env.referralCommissionRate;
          const commissionAmount = Math.round(earning.amount * commissionRate * 100) / 100;
          
          if (commissionAmount > 0) {
            const existingCommission = await Earning.findOne({
              isReferralCommission: true,
              referredUserId: referredUser._id,
              applicationId: earning.applicationId,
            });
            
            if (!existingCommission) {
              await Earning.create({
                userId: referral.referrerId,
                productId: earning.productId,
                applicationId: earning.applicationId,
                amount: commissionAmount,
                status: 'completed',
                type: 'referral_commission',
                earnedAt: new Date(),
                creditedAt: new Date(),
                isReferralCommission: true,
                referrerId: referral.referrerId,
                referredUserId: referredUser._id,
                referralCommissionRate: commissionRate,
              });
              
              await User.findByIdAndUpdate(referral.referrerId, {
                $inc: {
                  walletBalance: commissionAmount,
                  totalEarnings: commissionAmount,
                  referralEarnings: commissionAmount,
                },
              });
            }
          }
        }
      }
    }

    // Update click log if exists
    if (earning.clickId) {
      await ClickLog.findOneAndUpdate(
        { clickId: earning.clickId },
        { status: 'converted' }
      );
    }

    await earning.save();

    res.json({
      success: true,
      message: 'Earning approved successfully',
      data: {
        earningId: earning._id.toString(),
        status: earning.status,
        approvalStatus: earning.approvalStatus,
        amount: earning.amount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject Earning (Admin)
 */
export const rejectEarning = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { earningId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin?.id;

    if (!adminId) {
      throw createError('Admin authentication required', 401, 'UNAUTHORIZED');
    }

    if (!reason || reason.trim().length === 0) {
      throw createError('Rejection reason is required', 400, 'VALIDATION_ERROR');
    }

    const earning = await Earning.findById(earningId);

    if (!earning) {
      throw createError('Earning not found', 404, 'NOT_FOUND');
    }

    if (earning.approvalStatus === 'rejected') {
      throw createError('Earning already rejected', 400, 'ALREADY_PROCESSED');
    }

    earning.approvalStatus = 'rejected';
    earning.status = 'cancelled';
    earning.approvedBy = new mongoose.Types.ObjectId(adminId);
    earning.approvedAt = new Date();
    earning.rejectionReason = reason;

    // Update click log if exists
    if (earning.clickId) {
      await ClickLog.findOneAndUpdate(
        { clickId: earning.clickId },
        { status: 'rejected' }
      );
    }

    await earning.save();

    res.json({
      success: true,
      message: 'Earning rejected successfully',
      data: {
        earningId: earning._id.toString(),
        status: earning.status,
        approvalStatus: earning.approvalStatus,
        rejectionReason: earning.rejectionReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust Earning Amount (Admin)
 */
export const adjustEarningAmount = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { earningId } = req.params;
    const { amount, reason } = req.body;
    const adminId = req.admin?.id;

    if (!adminId) {
      throw createError('Admin authentication required', 401, 'UNAUTHORIZED');
    }

    if (!amount || Number(amount) < 0) {
      throw createError('Valid amount is required', 400, 'VALIDATION_ERROR');
    }

    if (!reason || reason.trim().length === 0) {
      throw createError('Reason is required for amount adjustment', 400, 'VALIDATION_ERROR');
    }

    const earning = await Earning.findById(earningId).populate('userId');

    if (!earning) {
      throw createError('Earning not found', 404, 'NOT_FOUND');
    }

    const userId = earning.userId as any;
    const oldAmount = earning.amount;
    const newAmount = Number(amount);
    const difference = newAmount - oldAmount;

    earning.amount = newAmount;
    earning.approvedBy = new mongoose.Types.ObjectId(adminId);
    earning.approvedAt = new Date();
    earning.postbackData = {
      ...earning.postbackData,
      amountAdjustment: {
        oldAmount,
        newAmount,
        difference,
        reason,
        adjustedBy: adminId,
        adjustedAt: new Date(),
      },
    };

    // If already credited, adjust wallet balance
    if (earning.status === 'completed' && earning.creditedAt) {
      await User.findByIdAndUpdate(userId._id, {
        $inc: {
          walletBalance: difference,
          totalEarnings: difference,
        },
      });
    }

    await earning.save();

    res.json({
      success: true,
      message: 'Earning amount adjusted successfully',
      data: {
        earningId: earning._id.toString(),
        oldAmount,
        newAmount,
        difference,
        reason,
      },
    });
  } catch (error) {
    next(error);
  }
};

