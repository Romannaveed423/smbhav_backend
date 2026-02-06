import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { InsuranceApplication } from '../models/InsuranceApplication';
import { LoanApplication } from '../models/LoanApplication';
import { createError } from '../utils/errors';
import mongoose from 'mongoose';

// ==================== Insurance Application Controllers ====================

/**
 * Submit Insurance application
 */
export const submitInsuranceApplication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      productId,
      insuranceType,
      sumAssured,
      paymentFrequency,
      policyholderDetails,
      nomineeDetails,
      healthHistory,
      documents,
    } = req.body;

    // Generate applicationId
    const count = await InsuranceApplication.countDocuments();
    const applicationId = `INS${String(count + 1).padStart(6, '0')}`;

    // Parse date of birth - handle both ISO string and other formats
    let dateOfBirth: Date;
    if (typeof policyholderDetails.dateOfBirth === 'string') {
      dateOfBirth = new Date(policyholderDetails.dateOfBirth);
      if (isNaN(dateOfBirth.getTime())) {
        throw createError('Invalid date of birth format', 400, 'VALIDATION_ERROR');
      }
    } else {
      dateOfBirth = policyholderDetails.dateOfBirth;
    }

    // Create application with timeline
    const application = await InsuranceApplication.create({
      applicationId,
      userId: new mongoose.Types.ObjectId(userId),
      productId: productId ? new mongoose.Types.ObjectId(productId) : undefined,
      insuranceType,
      sumAssured,
      paymentFrequency,
      policyholderDetails: {
        ...policyholderDetails,
        dateOfBirth,
      },
      nomineeDetails: nomineeDetails ? {
        ...nomineeDetails,
        dateOfBirth: nomineeDetails.dateOfBirth ? (() => {
          const dob = new Date(nomineeDetails.dateOfBirth);
          return isNaN(dob.getTime()) ? undefined : dob;
        })() : undefined,
      } : undefined,
      healthHistory: healthHistory || {},
      documents: documents || {},
      status: 'pending',
      kycStatus: 'pending',
      timeline: [
        {
          title: 'Application Submitted',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'completed',
          icon: 'check_circle',
          timestamp: new Date(),
          description: 'Your insurance application has been received',
        },
        {
          title: 'KYC Verification',
          time: null,
          status: 'pending',
          icon: 'verified_user',
          description: 'Verifying your KYC documents',
        },
        {
          title: 'Medical Review',
          time: null,
          status: 'pending',
          icon: 'medical_services',
          description: 'Reviewing health history and medical documents',
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
          description: 'Application will be approved and policy will be issued',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Insurance application submitted successfully',
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
 * Get Insurance application status
 */
export const getInsuranceApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;

    const application = await InsuranceApplication.findOne({
      applicationId,
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!application) {
      throw createError('Insurance application not found', 404, 'NOT_FOUND');
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
        insuranceType: application.insuranceType,
        sumAssured: application.sumAssured,
        submittedAt: application.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user Insurance applications
 */
export const getUserInsuranceApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
      InsuranceApplication.find(query)
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

// ==================== Loan Application Controllers ====================

/**
 * Submit Loan application
 */
export const submitLoanApplication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      productId,
      loanType,
      loanAmount,
      tenure,
      personalDetails,
      employmentDetails,
      eligibility,
      documents,
    } = req.body;

    // Generate applicationId
    const count = await LoanApplication.countDocuments();
    const applicationId = `LOAN${String(count + 1).padStart(6, '0')}`;

    // Create application with timeline
    const application = await LoanApplication.create({
      applicationId,
      userId: new mongoose.Types.ObjectId(userId),
      productId: productId ? new mongoose.Types.ObjectId(productId) : undefined,
      loanType,
      loanAmount,
      tenure,
      personalDetails: {
        ...personalDetails,
        panNumber: personalDetails.panNumber ? personalDetails.panNumber.toUpperCase() : undefined,
      },
      employmentDetails: employmentDetails || {},
      eligibility: eligibility || {},
      documents: documents || {},
      status: 'pending',
      kycStatus: 'pending',
      timeline: [
        {
          title: 'Application Submitted',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'completed',
          icon: 'check_circle',
          timestamp: new Date(),
          description: 'Your loan application has been received',
        },
        {
          title: 'KYC Verification',
          time: null,
          status: 'pending',
          icon: 'verified_user',
          description: 'Verifying your KYC documents',
        },
        {
          title: 'Credit Check',
          time: null,
          status: 'pending',
          icon: 'credit_card',
          description: 'Checking credit history and eligibility',
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
          description: 'Application will be approved and loan will be disbursed',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
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
 * Get Loan application status
 */
export const getLoanApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;

    const application = await LoanApplication.findOne({
      applicationId,
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!application) {
      throw createError('Loan application not found', 404, 'NOT_FOUND');
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
        loanType: application.loanType,
        loanAmount: application.loanAmount,
        tenure: application.tenure,
        submittedAt: application.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user Loan applications
 */
export const getUserLoanApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
      LoanApplication.find(query)
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

