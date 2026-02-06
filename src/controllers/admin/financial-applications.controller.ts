import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../middleware/admin';
import { SIPApplication } from '../../models/SIPApplication';
import { MutualFundApplication } from '../../models/MutualFundApplication';
import { InsuranceApplication } from '../../models/InsuranceApplication';
import { LoanApplication } from '../../models/LoanApplication';
import { User } from '../../models/User';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

// ==================== SIP Application Admin Controllers ====================

/**
 * Get all SIP applications (Admin)
 */
export const getAdminSIPApplications = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate as string);
      if (endDate) query.submittedAt.$lte = new Date(endDate as string);
    }

    if (search) {
      query.$or = [
        { applicationId: { $regex: search, $options: 'i' } },
        { panNumber: { $regex: search, $options: 'i' } },
        { aadharNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [applications, total] = await Promise.all([
      SIPApplication.find(query)
        .populate('userId', 'name email phone')
        .populate('productId', 'title')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      SIPApplication.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get SIP application details (Admin)
 */
export const getAdminSIPApplicationDetails = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;

    const application = await SIPApplication.findOne({ applicationId })
      .populate('userId', 'name email phone')
      .populate('productId', 'title')
      .populate('approvedBy', 'name email')
      .lean();

    if (!application) {
      throw createError('SIP application not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update SIP application status (Admin)
 */
export const updateSIPApplicationStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { status, notes, rejectedReason } = req.body;
    const adminId = req.user?.id;

    const application = await SIPApplication.findOne({ applicationId });
    if (!application) {
      throw createError('SIP application not found', 404, 'NOT_FOUND');
    }

    // Update status
    application.status = status;
    if (notes) application.notes = notes;
    if (rejectedReason) application.rejectedReason = rejectedReason;
    if (adminId) application.approvedBy = new mongoose.Types.ObjectId(adminId);

    // Update timeline
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Mark current step as completed
    const currentStep = application.timeline.find((step) => step.status === 'current');
    if (currentStep) {
      currentStep.status = 'completed';
      currentStep.time = timeStr;
      currentStep.timestamp = now;
    }

    // Add new timeline entry based on status
    if (status === 'in_review') {
      const reviewStep = application.timeline.find((step) => step.title === 'In Review');
      if (reviewStep) {
        reviewStep.status = 'current';
        reviewStep.time = timeStr;
        reviewStep.timestamp = now;
      }
    } else if (status === 'approved') {
      const approvedStep = application.timeline.find((step) => step.title === 'Approval');
      if (approvedStep) {
        approvedStep.status = 'completed';
        approvedStep.time = timeStr;
        approvedStep.timestamp = now;
      }
      application.kycStatus = 'verified';
    } else if (status === 'rejected') {
      application.kycStatus = 'rejected';
    }

    await application.save();

    res.json({
      success: true,
      message: 'SIP application status updated successfully',
      data: {
        applicationId: application.applicationId,
        status: application.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Mutual Fund Application Admin Controllers ====================

/**
 * Get all Mutual Fund applications (Admin)
 */
export const getAdminMutualFundApplications = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate as string);
      if (endDate) query.submittedAt.$lte = new Date(endDate as string);
    }

    if (search) {
      query.$or = [
        { applicationId: { $regex: search, $options: 'i' } },
        { panNumber: { $regex: search, $options: 'i' } },
        { aadharNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [applications, total] = await Promise.all([
      MutualFundApplication.find(query)
        .populate('userId', 'name email phone')
        .populate('productId', 'title')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MutualFundApplication.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Mutual Fund application details (Admin)
 */
export const getAdminMutualFundApplicationDetails = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;

    const application = await MutualFundApplication.findOne({ applicationId })
      .populate('userId', 'name email phone')
      .populate('productId', 'title')
      .populate('approvedBy', 'name email')
      .lean();

    if (!application) {
      throw createError('Mutual Fund application not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Mutual Fund application status (Admin)
 */
export const updateMutualFundApplicationStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { status, notes, rejectedReason } = req.body;
    const adminId = req.user?.id;

    const application = await MutualFundApplication.findOne({ applicationId });
    if (!application) {
      throw createError('Mutual Fund application not found', 404, 'NOT_FOUND');
    }

    // Update status
    application.status = status;
    if (notes) application.notes = notes;
    if (rejectedReason) application.rejectedReason = rejectedReason;
    if (adminId) application.approvedBy = new mongoose.Types.ObjectId(adminId);

    // Update timeline
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Mark current step as completed
    const currentStep = application.timeline.find((step) => step.status === 'current');
    if (currentStep) {
      currentStep.status = 'completed';
      currentStep.time = timeStr;
      currentStep.timestamp = now;
    }

    // Add new timeline entry based on status
    if (status === 'in_review') {
      const reviewStep = application.timeline.find((step) => step.title === 'In Review');
      if (reviewStep) {
        reviewStep.status = 'current';
        reviewStep.time = timeStr;
        reviewStep.timestamp = now;
      }
    } else if (status === 'approved') {
      const approvedStep = application.timeline.find((step) => step.title === 'Approval');
      if (approvedStep) {
        approvedStep.status = 'completed';
        approvedStep.time = timeStr;
        approvedStep.timestamp = now;
      }
      application.kycStatus = 'verified';
    } else if (status === 'rejected') {
      application.kycStatus = 'rejected';
    }

    await application.save();

    res.json({
      success: true,
      message: 'Mutual Fund application status updated successfully',
      data: {
        applicationId: application.applicationId,
        status: application.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

