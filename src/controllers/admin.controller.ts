import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Lead from '../models/Lead';
import KYCDocument from '../models/KYCDocument';
import Withdrawal from '../models/Withdrawal';
import Campaign from '../models/Campaign';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError, ValidationError } from '../utils/errors';
import { WITHDRAWAL_STATUS, KYC_STATUS } from '../utils/constants';
import { createTransaction } from '../services/transaction.service';
import { createNotification } from '../services/notification.service';

// Products
export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Leads
export const getLeadById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id)
      .populate('agentId', 'name phoneNumber email')
      .populate('productId');

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllLeads = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, agentId, page = 1, limit = 20 } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (agentId) query.agentId = agentId;

    const leads = await Lead.find(query)
      .populate('agentId', 'name phoneNumber')
      .populate('productId', 'name category')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      data: leads,
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

// KYC
export const getPendingKYC = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documents = await KYCDocument.find({
      verificationStatus: 'pending',
    })
      .populate('userId', 'name phoneNumber email')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyKYCDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const document = await KYCDocument.findById(id).populate('userId');
    if (!document) {
      throw new NotFoundError('Document not found');
    }

    document.verificationStatus = status;
    document.verifiedBy = new mongoose.Types.ObjectId(req.user!.userId);
    document.verifiedAt = new Date();
    if (status === 'rejected' && rejectionReason) {
      document.rejectionReason = rejectionReason;
    }

    await document.save();

    // Update user KYC status if all documents are approved
    if (status === 'approved') {
      const user = await User.findById(document.userId);
      if (user) {
        const allDocuments = await KYCDocument.find({
          userId: user._id,
          verificationStatus: 'approved',
        });
        // Check if all required documents are approved
        if (allDocuments.length >= 2) {
          user.kycStatus = KYC_STATUS.VERIFIED;
          await user.save();
        }
      }
    }

    await createNotification({
      userId: (document.userId as any)._id,
      type: 'kyc',
      title: 'KYC Document Update',
      message: `Your ${document.documentType} has been ${status}`,
      metadata: { documentId: document._id },
    });

    res.json({
      success: true,
      message: 'Document verification updated',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

// Withdrawals
export const getPendingWithdrawals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const withdrawals = await Withdrawal.find({
      status: WITHDRAWAL_STATUS.PENDING,
    })
      .populate('userId', 'name phoneNumber email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: withdrawals,
    });
  } catch (error) {
    next(error);
  }
};

export const processWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, remarks } = req.body;

    const withdrawal = await Withdrawal.findById(id).populate('userId');
    if (!withdrawal) {
      throw new NotFoundError('Withdrawal not found');
    }

    const user = await User.findById(withdrawal.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (status === WITHDRAWAL_STATUS.COMPLETED) {
      if (user.walletBalance < withdrawal.amount) {
        throw new ValidationError('User has insufficient balance');
      }

      // Deduct from wallet
      const balanceBefore = user.walletBalance;
      const balanceAfter = balanceBefore - withdrawal.amount;
      user.walletBalance = balanceAfter;
      await user.save();

      // Create transaction
      const transaction = await createTransaction({
        userId: withdrawal.userId,
        type: 'withdrawal',
        amount: -withdrawal.amount,
        status: 'completed',
        description: `Withdrawal of ₹${withdrawal.amount}`,
        relatedEntity: { type: 'withdrawal', id: withdrawal._id },
        balanceBefore,
        balanceAfter,
      });

      withdrawal.transactionId = transaction._id;
    } else if (status === WITHDRAWAL_STATUS.REJECTED) {
      if (!rejectionReason) {
        throw new ValidationError('Rejection reason is required');
      }
      withdrawal.rejectionReason = rejectionReason;
    }

    withdrawal.status = status;
    withdrawal.processedBy = new mongoose.Types.ObjectId(req.user!.userId);
    withdrawal.processedAt = new Date();
    if (remarks) withdrawal.remarks = remarks;

    await withdrawal.save();

    await createNotification({
      userId: withdrawal.userId,
      type: 'payment',
      title: 'Withdrawal Update',
      message: `Your withdrawal request has been ${status}`,
      metadata: { withdrawalId: withdrawal._id },
    });

    res.json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

// Campaigns
export const createCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaign = await Campaign.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByIdAndUpdate(id, req.body, { new: true });
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }
    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }
    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Users
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;
    const query: any = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-otp')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
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

export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-otp');
    if (!user) {
      throw new NotFoundError('User not found');
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-otp');
    if (!user) {
      throw new NotFoundError('User not found');
    }
    res.json({
      success: true,
      message: 'User status updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Overall statistics
    const [
      totalUsers,
      activeUsers,
      totalLeads,
      totalProducts,
      totalWithdrawals,
      pendingWithdrawals,
      totalTransactions,
      todayTransactions,
      monthTransactions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Lead.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Withdrawal.countDocuments(),
      Withdrawal.countDocuments({ status: 'pending' }),
      Transaction.countDocuments({ status: 'completed' }),
      Transaction.countDocuments({
        status: 'completed',
        createdAt: { $gte: today },
      }),
      Transaction.countDocuments({
        status: 'completed',
        createdAt: { $gte: monthStart },
      }),
    ]);

    // Earnings
    const [totalEarnings, todayEarnings, monthEarnings] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            type: { $in: ['lead_commission', 'referral_bonus', 'bonus_campaign'] },
            status: 'completed',
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
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
            type: { $in: ['lead_commission', 'referral_bonus', 'bonus_campaign'] },
            status: 'completed',
            createdAt: { $gte: monthStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    // Leads by status
    const leadsByStatus = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const leadsStatusMap: Record<string, number> = {};
    leadsByStatus.forEach((item) => {
      leadsStatusMap[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        leads: {
          total: totalLeads,
          byStatus: leadsStatusMap,
        },
        products: {
          total: totalProducts,
        },
        withdrawals: {
          total: totalWithdrawals,
          pending: pendingWithdrawals,
        },
        transactions: {
          total: totalTransactions,
          today: todayTransactions,
          thisMonth: monthTransactions,
        },
        earnings: {
          total: totalEarnings[0]?.total || 0,
          today: todayEarnings[0]?.total || 0,
          thisMonth: monthEarnings[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

