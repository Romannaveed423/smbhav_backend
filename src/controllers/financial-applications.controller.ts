import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SIPApplication } from '../models/SIPApplication';
import { MutualFundApplication } from '../models/MutualFundApplication';
import { InsuranceApplication } from '../models/InsuranceApplication';
import { LoanApplication } from '../models/LoanApplication';
import { createError } from '../utils/errors';
import mongoose from 'mongoose';

// ==================== SIP Application Controllers ====================

/**
 * Submit SIP application
 */
export const submitSIPApplication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      productId,
      sipType,
      monthlyInstallment,
      preferredSIPDate,
      duration,
      assetAllocation,
      panNumber,
      aadharNumber,
      additionalDocument,
    } = req.body;

    // Generate applicationId
    const count = await SIPApplication.countDocuments();
    const applicationId = `SIP${String(count + 1).padStart(6, '0')}`;

    // Create application with timeline
    const application = await SIPApplication.create({
      applicationId,
      userId: new mongoose.Types.ObjectId(userId),
      productId: productId ? new mongoose.Types.ObjectId(productId) : undefined,
      sipType,
      monthlyInstallment,
      preferredSIPDate,
      duration,
      assetAllocation,
      panNumber: panNumber.toUpperCase(),
      aadharNumber: aadharNumber.replace(/\s/g, ''), // Remove spaces
      additionalDocument: additionalDocument || undefined,
      status: 'pending',
      kycStatus: 'pending',
      timeline: [
        {
          title: 'Application Submitted',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'completed',
          icon: 'check_circle',
          timestamp: new Date(),
          description: 'Your SIP application has been received',
        },
        {
          title: 'KYC Verification',
          time: null,
          status: 'pending',
          icon: 'verified_user',
          description: 'Verifying your KYC documents',
        },
        {
          title: 'In Review',
          time: null,
          status: 'pending',
          icon: 'hourglass_empty',
          description: 'Application is being reviewed',
        },
        {
          title: 'Approval',
          time: null,
          status: 'pending',
          icon: 'verified',
          description: 'Application will be approved and SIP will be activated',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'SIP application submitted successfully',
      data: {
        applicationId: application.applicationId,
        status: application.status,
        submittedAt: application.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get SIP application status
 */
export const getSIPApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;

    const application = await SIPApplication.findOne({
      applicationId,
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!application) {
      throw createError('SIP application not found', 404, 'NOT_FOUND');
    }

    const statusMap: Record<string, string> = {
      pending: 'Pending',
      in_review: 'In Review',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    };

    res.json({
      success: true,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        currentStatus: statusMap[application.status] || application.status,
        kycStatus: application.kycStatus,
        timeline: application.timeline || [],
        sipType: application.sipType,
        monthlyInstallment: application.monthlyInstallment,
        duration: application.duration,
        assetAllocation: application.assetAllocation,
        submittedAt: application.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user SIP applications
 */
export const getUserSIPApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate as string);
      if (endDate) query.submittedAt.$lte = new Date(endDate as string);
    }

    const [applications, total] = await Promise.all([
      SIPApplication.find(query)
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

// ==================== Mutual Fund Application Controllers ====================

/**
 * Submit Mutual Fund application
 */
export const submitMutualFundApplication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      productId,
      investmentMode,
      mutualFundStrategy,
      investmentDuration,
      riskTolerance,
      panNumber,
      aadharNumber,
      additionalDocument,
      investmentAmount,
    } = req.body;

    // Determine risk tolerance label
    let riskToleranceLabel: 'Low' | 'Moderate' | 'High';
    if (riskTolerance <= 0.33) {
      riskToleranceLabel = 'Low';
    } else if (riskTolerance <= 0.66) {
      riskToleranceLabel = 'Moderate';
    } else {
      riskToleranceLabel = 'High';
    }

    // Generate applicationId
    const count = await MutualFundApplication.countDocuments();
    const applicationId = `MF${String(count + 1).padStart(6, '0')}`;

    // Create application with timeline
    const application = await MutualFundApplication.create({
      applicationId,
      userId: new mongoose.Types.ObjectId(userId),
      productId: productId ? new mongoose.Types.ObjectId(productId) : undefined,
      investmentMode,
      mutualFundStrategy: mutualFundStrategy || undefined,
      investmentDuration: investmentDuration || undefined,
      riskTolerance,
      riskToleranceLabel,
      panNumber: panNumber.toUpperCase(),
      aadharNumber: aadharNumber.replace(/\s/g, ''), // Remove spaces
      additionalDocument: additionalDocument || undefined,
      investmentAmount,
      status: 'pending',
      kycStatus: 'pending',
      timeline: [
        {
          title: 'Application Submitted',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'completed',
          icon: 'check_circle',
          timestamp: new Date(),
          description: 'Your Mutual Fund application has been received',
        },
        {
          title: 'KYC Verification',
          time: null,
          status: 'pending',
          icon: 'verified_user',
          description: 'Verifying your KYC documents',
        },
        {
          title: 'In Review',
          time: null,
          status: 'pending',
          icon: 'hourglass_empty',
          description: 'Application is being reviewed',
        },
        {
          title: 'Approval',
          time: null,
          status: 'pending',
          icon: 'verified',
          description: 'Application will be approved and investment will be processed',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Mutual Fund application submitted successfully',
      data: {
        applicationId: application.applicationId,
        status: application.status,
        submittedAt: application.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Mutual Fund application status
 */
export const getMutualFundApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;

    const application = await MutualFundApplication.findOne({
      applicationId,
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!application) {
      throw createError('Mutual Fund application not found', 404, 'NOT_FOUND');
    }

    const statusMap: Record<string, string> = {
      pending: 'Pending',
      in_review: 'In Review',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    };

    res.json({
      success: true,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        currentStatus: statusMap[application.status] || application.status,
        kycStatus: application.kycStatus,
        timeline: application.timeline || [],
        investmentMode: application.investmentMode,
        investmentAmount: application.investmentAmount,
        riskToleranceLabel: application.riskToleranceLabel,
        submittedAt: application.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user Mutual Fund applications
 */
export const getUserMutualFundApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate as string);
      if (endDate) query.submittedAt.$lte = new Date(endDate as string);
    }

    const [applications, total] = await Promise.all([
      MutualFundApplication.find(query)
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

