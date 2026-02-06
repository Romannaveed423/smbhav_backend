import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../middleware/admin';
import { InsuranceApplication } from '../../models/InsuranceApplication';
import { LoanApplication } from '../../models/LoanApplication';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

// ==================== Insurance Application Admin Controllers ====================

/**
 * Get all Insurance applications (Admin)
 */
export const getAdminInsuranceApplications = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
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
        { 'policyholderDetails.fullName': { $regex: search, $options: 'i' } },
        { 'policyholderDetails.email': { $regex: search, $options: 'i' } },
        { 'policyholderDetails.contactNumber': { $regex: search, $options: 'i' } },
      ];
    }

    const [applications, total] = await Promise.all([
      InsuranceApplication.find(query)
        .populate('userId', 'name email phone')
        .populate('productId', 'title')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InsuranceApplication.countDocuments(query),
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
 * Get Insurance application details (Admin)
 */
export const getAdminInsuranceApplicationDetails = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;

    const application = await InsuranceApplication.findOne({ applicationId })
      .populate('userId', 'name email phone')
      .populate('productId', 'title')
      .populate('approvedBy', 'name email')
      .lean();

    if (!application) {
      throw createError('Insurance application not found', 404, 'NOT_FOUND');
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
 * Update Insurance application status (Admin)
 */
export const updateInsuranceApplicationStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { status, notes, rejectedReason } = req.body;
    const adminId = req.user?.id;

    const application = await InsuranceApplication.findOne({ applicationId });
    if (!application) {
      throw createError('Insurance application not found', 404, 'NOT_FOUND');
    }

    application.status = status;
    if (notes) application.notes = notes;
    if (rejectedReason) application.rejectedReason = rejectedReason;
    if (adminId) application.approvedBy = new mongoose.Types.ObjectId(adminId);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const currentStep = application.timeline.find((step) => step.status === 'current');
    if (currentStep) {
      currentStep.status = 'completed';
      currentStep.time = timeStr;
      currentStep.timestamp = now;
    }

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
      message: 'Insurance application status updated successfully',
      data: {
        applicationId: application.applicationId,
        status: application.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Loan Application Admin Controllers ====================

/**
 * Get all Loan applications (Admin)
 */
export const getAdminLoanApplications = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
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
        { 'personalDetails.fullName': { $regex: search, $options: 'i' } },
        { 'personalDetails.mobileNumber': { $regex: search, $options: 'i' } },
        { 'personalDetails.panNumber': { $regex: search, $options: 'i' } },
      ];
    }

    const [applications, total] = await Promise.all([
      LoanApplication.find(query)
        .populate('userId', 'name email phone')
        .populate('productId', 'title')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      LoanApplication.countDocuments(query),
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
 * Get Loan application details (Admin)
 */
export const getAdminLoanApplicationDetails = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;

    const application = await LoanApplication.findOne({ applicationId })
      .populate('userId', 'name email phone')
      .populate('productId', 'title')
      .populate('approvedBy', 'name email')
      .lean();

    if (!application) {
      throw createError('Loan application not found', 404, 'NOT_FOUND');
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
 * Update Loan application status (Admin)
 */
export const updateLoanApplicationStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { status, notes, rejectedReason } = req.body;
    const adminId = req.user?.id;

    const application = await LoanApplication.findOne({ applicationId });
    if (!application) {
      throw createError('Loan application not found', 404, 'NOT_FOUND');
    }

    application.status = status;
    if (notes) application.notes = notes;
    if (rejectedReason) application.rejectedReason = rejectedReason;
    if (adminId) application.approvedBy = new mongoose.Types.ObjectId(adminId);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const currentStep = application.timeline.find((step) => step.status === 'current');
    if (currentStep) {
      currentStep.status = 'completed';
      currentStep.time = timeStr;
      currentStep.timestamp = now;
    }

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
      message: 'Loan application status updated successfully',
      data: {
        applicationId: application.applicationId,
        status: application.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

