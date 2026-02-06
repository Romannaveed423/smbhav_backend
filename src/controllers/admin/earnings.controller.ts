import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../middleware/admin';
import { ClickLog } from '../../models/ClickLog';
import { Earning } from '../../models/Earning';
import { User } from '../../models/User';
import { Offer } from '../../models/Offer';
import { Product } from '../../models/Product';
import { Referral } from '../../models/Referral';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';
import { env } from '../../config/env';

/**
 * Process referral commission when a referred user completes an offer
 * Helper function (duplicated from earnings.controller.ts)
 */
async function processReferralCommission(
  referredUserId: mongoose.Types.ObjectId,
  earningAmount: number,
  originalEarningId: mongoose.Types.ObjectId
): Promise<void> {
  try {
    // Find the original earning to get productId and applicationId
    const originalEarning = await Earning.findById(originalEarningId);
    if (!originalEarning) {
      return;
    }

    // Find the user who was referred
    const referredUser = await User.findById(referredUserId);
    if (!referredUser || !referredUser.referredBy) {
      return; // User was not referred, no commission
    }

    // Find the referral relationship
    const referral = await Referral.findOne({
      referredUserId: referredUser._id,
      referrerId: referredUser.referredBy,
    });

    if (!referral) {
      return; // No referral record found
    }

    // Calculate commission (default 10% from env)
    const commissionRate = env.referralCommissionRate;
    const commissionAmount = Math.round(earningAmount * commissionRate * 100) / 100; // Round to 2 decimals

    if (commissionAmount <= 0) {
      return; // No commission to process
    }

    // Check if commission already exists for this earning
    const existingCommissionQuery: any = {
      isReferralCommission: true,
      referredUserId: referredUser._id,
    };
    if (originalEarning.applicationId) {
      existingCommissionQuery.applicationId = originalEarning.applicationId;
    } else if (originalEarning.clickId) {
      // For click-based tracking, use clickId instead
      existingCommissionQuery.clickId = originalEarning.clickId;
    }
    const existingCommission = await Earning.findOne(existingCommissionQuery);

    if (existingCommission) {
      return; // Commission already processed
    }

    // Create commission earning for referrer
    const commissionEarningData: any = {
      userId: referral.referrerId,
      productId: originalEarning.productId,
      amount: commissionAmount,
      status: 'completed',
      type: 'referral_commission',
      earnedAt: new Date(),
      creditedAt: new Date(),
      isReferralCommission: true,
      referrerId: referral.referrerId,
      referredUserId: referredUser._id,
      referralCommissionRate: commissionRate,
    };
    
    // Add applicationId or clickId if available
    if (originalEarning.applicationId) {
      commissionEarningData.applicationId = originalEarning.applicationId;
    }
    if (originalEarning.clickId) {
      commissionEarningData.clickId = originalEarning.clickId;
    }
    
    await Earning.create(commissionEarningData);

    // Update referrer's wallet and stats
    await User.findByIdAndUpdate(referral.referrerId, {
      $inc: {
        walletBalance: commissionAmount,
        totalEarnings: commissionAmount,
        referralEarnings: commissionAmount,
      },
    });

    // Update referral record
    referral.totalCommissions += commissionAmount;
    referral.lastCommissionAt = new Date();
    if (referral.status === 'pending') {
      referral.status = 'active';
    }
    await referral.save();

    // Update referrer's active referrals count if this is first commission for this referral
    const isFirstCommission = await Earning.countDocuments({
      isReferralCommission: true,
      referredUserId: referredUser._id,
    }) === 1;

    if (isFirstCommission) {
      await User.findByIdAndUpdate(referral.referrerId, {
        $inc: { activeReferrals: 1 },
      });
    }
  } catch (error) {
    // Log error but don't throw - we don't want to break the main earning flow
    console.error('Error processing referral commission:', error);
  }
}

/**
 * Get click log by ID
 * Admin only endpoint
 */
export const getClickLogById = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clickLogId } = req.params;

    const clickLog = await ClickLog.findById(clickLogId)
      .populate('userId', 'name email phone')
      .populate('productId', 'name category')
      .populate('offerId', 'name payoutCost payoutType');

    if (!clickLog) {
      throw createError('Click log not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: clickLog._id.toString(),
        clickId: clickLog.clickId,
        user: clickLog.userId ? {
          id: (clickLog.userId as any)._id.toString(),
          name: (clickLog.userId as any).name || 'N/A',
          email: (clickLog.userId as any).email || 'N/A',
          phone: (clickLog.userId as any).phone,
        } : null,
        product: clickLog.productId ? {
          id: (clickLog.productId as any)._id.toString(),
          name: (clickLog.productId as any).name || 'N/A',
          category: (clickLog.productId as any).category || 'N/A',
        } : null,
        offer: clickLog.offerId ? {
          id: (clickLog.offerId as any)._id.toString(),
          name: (clickLog.offerId as any).name || 'N/A',
          amount: (clickLog.offerId as any).payoutCost || 0,
        } : null,
        taskUrl: clickLog.taskUrl,
        redirectUrl: clickLog.redirectUrl,
        ipAddress: clickLog.ipAddress,
        userAgent: clickLog.userAgent,
        referrer: clickLog.referrer,
        clickedAt: clickLog.clickedAt,
        expiresAt: clickLog.expiresAt,
        status: clickLog.status,
        conversionId: clickLog.conversionId,
        postbackReceived: clickLog.postbackReceived,
        postbackReceivedAt: clickLog.postbackReceivedAt,
        createdAt: clickLog.createdAt,
        updatedAt: clickLog.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get click log by click ID
 * Admin only endpoint
 */
export const getClickLogByClickId = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clickId } = req.params;

    const clickLog = await ClickLog.findOne({ clickId })
      .populate('userId', 'name email phone')
      .populate('productId', 'name category')
      .populate('offerId', 'name payoutCost payoutType');

    if (!clickLog) {
      throw createError('Click log not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: clickLog._id.toString(),
        clickId: clickLog.clickId,
        user: clickLog.userId ? {
          id: (clickLog.userId as any)._id.toString(),
          name: (clickLog.userId as any).name || 'N/A',
          email: (clickLog.userId as any).email || 'N/A',
          phone: (clickLog.userId as any).phone,
        } : null,
        product: clickLog.productId ? {
          id: (clickLog.productId as any)._id.toString(),
          name: (clickLog.productId as any).name || 'N/A',
          category: (clickLog.productId as any).category || 'N/A',
        } : null,
        offer: clickLog.offerId ? {
          id: (clickLog.offerId as any)._id.toString(),
          name: (clickLog.offerId as any).name || 'N/A',
          amount: (clickLog.offerId as any).payoutCost || 0,
        } : null,
        taskUrl: clickLog.taskUrl,
        redirectUrl: clickLog.redirectUrl,
        ipAddress: clickLog.ipAddress,
        userAgent: clickLog.userAgent,
        referrer: clickLog.referrer,
        clickedAt: clickLog.clickedAt,
        expiresAt: clickLog.expiresAt,
        status: clickLog.status,
        conversionId: clickLog.conversionId,
        postbackReceived: clickLog.postbackReceived,
        postbackReceivedAt: clickLog.postbackReceivedAt,
        createdAt: clickLog.createdAt,
        updatedAt: clickLog.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get click logs with filtering and pagination
 * Admin only endpoint
 */
export const getClickLogs = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, userId, productId, offerId, startDate, endDate, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId as string);
    }
    if (productId) {
      query.productId = new mongoose.Types.ObjectId(productId as string);
    }
    if (offerId) {
      query.offerId = new mongoose.Types.ObjectId(offerId as string);
    }
    if (startDate || endDate) {
      query.clickedAt = {};
      if (startDate) query.clickedAt.$gte = new Date(startDate as string);
      if (endDate) query.clickedAt.$lte = new Date(endDate as string);
    }

    // Search functionality - search in clickId, conversionId, and ObjectIds
    if (search) {
      const searchConditions: any[] = [
        { clickId: { $regex: search as string, $options: 'i' } },
        { conversionId: { $regex: search as string, $options: 'i' } },
      ];

      // If search looks like an ObjectId, search in userId, offerId, productId
      if (mongoose.Types.ObjectId.isValid(search as string)) {
        const searchObjectId = new mongoose.Types.ObjectId(search as string);
        searchConditions.push(
          { userId: searchObjectId },
          { offerId: searchObjectId },
          { productId: searchObjectId }
        );
      }

      // For text search in populated fields, search in User, Offer, and Product collections
      // and add their IDs to the query
      const userMatches = await User.find({
        $or: [
          { name: { $regex: search as string, $options: 'i' } },
          { email: { $regex: search as string, $options: 'i' } },
        ],
      }).select('_id');
      if (userMatches.length > 0) {
        searchConditions.push({ userId: { $in: userMatches.map((u) => u._id) } });
      }

      const offerMatches = await Offer.find({
        name: { $regex: search as string, $options: 'i' },
      }).select('_id');
      if (offerMatches.length > 0) {
        searchConditions.push({ offerId: { $in: offerMatches.map((o) => o._id) } });
      }

      const productMatches = await Product.find({
        name: { $regex: search as string, $options: 'i' },
      }).select('_id');
      if (productMatches.length > 0) {
        searchConditions.push({ productId: { $in: productMatches.map((p) => p._id) } });
      }

      query.$or = searchConditions;
    }

    const [clickLogs, total] = await Promise.all([
      ClickLog.find(query)
        .populate('userId', 'name email phone')
        .populate('productId', 'name category')
        .populate('offerId', 'name payoutCost payoutType')
        .sort({ clickedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ClickLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        clickLogs: clickLogs.map((log) => ({
          id: log._id.toString(),
          clickId: log.clickId,
          user: log.userId ? {
            id: (log.userId as any)._id.toString(),
            name: (log.userId as any).name || 'N/A',
            email: (log.userId as any).email || 'N/A',
            phone: (log.userId as any).phone,
          } : null,
          product: log.productId ? {
            id: (log.productId as any)._id.toString(),
            name: (log.productId as any).name || 'N/A',
            category: (log.productId as any).category || 'N/A',
          } : null,
          offer: log.offerId ? {
            id: (log.offerId as any)._id.toString(),
            name: (log.offerId as any).name || 'N/A',
            amount: (log.offerId as any).payoutCost || 0,
          } : null,
          taskUrl: log.taskUrl,
          redirectUrl: log.redirectUrl,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          referrer: log.referrer,
          clickedAt: log.clickedAt,
          expiresAt: log.expiresAt,
          status: log.status,
          conversionId: log.conversionId,
          postbackReceived: log.postbackReceived,
          postbackReceivedAt: log.postbackReceivedAt,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt,
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
 * Get conversions (earnings) with filtering and pagination
 * Admin only endpoint
 */
export const getConversions = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, approvalStatus, userId, productId, startDate, endDate, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }
    if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId as string);
    }
    if (productId) {
      query.productId = new mongoose.Types.ObjectId(productId as string);
    }
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
    } else {
      // Only get earnings with conversions (have clickId or conversionId)
      query.$or = [
        { clickId: { $exists: true, $ne: null } },
        { conversionId: { $exists: true, $ne: null } },
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

    // Get click log data for each earning
    const clickLogIds = earnings
      .filter(e => e.clickId)
      .map(e => e.clickId);

    const clickLogs = await ClickLog.find({ clickId: { $in: clickLogIds } });

    const clickLogMap = new Map(clickLogs.map(log => [log.clickId, log]));

    res.json({
      success: true,
      data: {
        conversions: earnings.map((earning) => {
          const clickLog = earning.clickId ? clickLogMap.get(earning.clickId) : null;
          
          return {
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
          };
        }),
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
 * Approve Conversion (Manual)
 * Admin only endpoint
 */
export const approveConversion = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { conversionId } = req.params;
    const { amount, notes } = req.body; // amount is optional override
    const adminId = req.admin?.id;

    if (!adminId) {
      throw createError('Admin authentication required', 401, 'UNAUTHORIZED');
    }

    // Find earning by conversionId
    const earning = await Earning.findOne({ conversionId })
      .populate('userId')
      .populate('productId');

    if (!earning) {
      throw createError('Conversion not found', 404, 'NOT_FOUND');
    }

    // Check if already processed
    if (earning.approvalStatus === 'manually_approved' || earning.approvalStatus === 'rejected') {
      throw createError(`Conversion already ${earning.approvalStatus === 'manually_approved' ? 'approved' : 'rejected'}`, 400, 'ALREADY_PROCESSED');
    }

    const userId = earning.userId as any;
    
    // Override amount if provided
    if (amount && Number(amount) > 0) {
      earning.amount = Number(amount);
    }
    
    // Approve the conversion
    earning.approvalStatus = 'manually_approved';
    earning.approvedBy = new mongoose.Types.ObjectId(adminId);
    earning.approvedAt = new Date();

    // Store notes in postbackData if provided
    if (notes) {
      earning.postbackData = {
        ...earning.postbackData,
        adminNotes: notes,
        approvedBy: adminId,
        approvedAt: new Date(),
      };
    }

    // If not already credited, credit the wallet
    if (earning.status !== 'completed') {
      earning.status = 'completed';
      earning.creditedAt = new Date();

      await User.findByIdAndUpdate(userId._id, {
        $inc: {
          walletBalance: earning.amount,
          totalEarnings: earning.amount,
        },
      });

      // Process referral commission if applicable
      if (!earning.isReferralCommission) {
        await processReferralCommission(userId._id, earning.amount, earning._id);
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
      message: 'Conversion approved successfully',
      data: {
        conversionId,
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
 * Reject Conversion
 * Admin only endpoint
 */
export const rejectConversion = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { conversionId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin?.id;

    if (!adminId) {
      throw createError('Admin authentication required', 401, 'UNAUTHORIZED');
    }

    if (!reason || reason.trim().length === 0) {
      throw createError('Rejection reason is required', 400, 'VALIDATION_ERROR');
    }

    const earning = await Earning.findOne({ conversionId });

    if (!earning) {
      throw createError('Conversion not found', 404, 'NOT_FOUND');
    }

    if (earning.approvalStatus === 'rejected') {
      throw createError('Conversion already rejected', 400, 'ALREADY_PROCESSED');
    }

    earning.approvalStatus = 'rejected';
    earning.status = 'cancelled';
    earning.approvedBy = new mongoose.Types.ObjectId(adminId);
    earning.approvedAt = new Date();
    earning.rejectionReason = reason;

    if (earning.clickId) {
      await ClickLog.findOneAndUpdate({ clickId: earning.clickId }, { status: 'rejected' });
    }

    await earning.save();

    res.json({
      success: true,
      message: 'Conversion rejected successfully',
      data: {
        conversionId,
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
 * Adjust Conversion Amount
 * Admin only endpoint
 */
export const adjustConversionAmount = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { conversionId } = req.params;
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

    const earning = await Earning.findOne({ conversionId }).populate('userId');

    if (!earning) {
      throw createError('Conversion not found', 404, 'NOT_FOUND');
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
      message: 'Conversion amount adjusted successfully',
      data: {
        conversionId,
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

