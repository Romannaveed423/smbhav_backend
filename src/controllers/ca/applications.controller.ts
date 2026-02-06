import e, { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CAApplication } from '../../models/CAApplication';
import { CAFormSchema } from '../../models/CAFormSchema';
import { CADocument } from '../../models/CADocument';
import { CAService } from '../../models/CAService';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';
import { date } from 'zod';
import { CAFormEntry } from '../../models/CAFormEntry';


 // user controllers for CA applications can be added here
/**
 * Submit service application
 */
export const submitApplication = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { 
      serviceId, 
      serviceType, 
      clientDetails, 
      documents,
      subSubcategoryId,  
      formData,
      price 
    } = req.body;

    // Validate service exists
     if (!serviceId || !serviceType || !subSubcategoryId || !price) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
      return;
    }

    /**
     * 1. Fetch active form schema
     */
    const formSchema = await CAFormSchema.findOne({
      subSubcategoryId,
      isActive: true,
    });

    if (!formSchema) {
      res.status(404).json({
        success: false,
        message: 'Form schema not found for this service',
      });
      return;
    }

    /**
     * 2. Validate required fields dynamically
     */
    for (const field of formSchema.fields) {
      if (field.isRequired && formData?.[field.name] == null) {
        res.status(400).json({
          success: false,
          message: `Missing required field: ${field.label}`,
        });
        return;
      }
    }

    /**
     * 3. Initialize timeline
     */
    const timeline = [
        {
          title: 'Application Submitted',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'completed',
          icon: 'check_circle',
          timestamp: new Date(),
          description: 'Your application has been received',
        },
        {
          title: 'In Review',
          time: null,
          status: 'pending',
          icon: 'hourglass_empty',
          description: 'CA expert will review your documents',
        },
        {
          title: 'Awaiting Clarification',
          time: null,
          status: 'pending',
          icon: 'info_outline',
          description: 'Additional information may be required',
        },
        {
          title: 'Approval',
          time: null,
          status: 'pending',
          icon: 'verified',
          description: 'Application will be approved and certificate issued',
        },
      ];

    // Create application
    const application = await CAApplication.create({
      userId: new mongoose.Types.ObjectId(userId),
      serviceId: new mongoose.Types.ObjectId(serviceId),
      serviceType,
      clientDetails,
      documents: documents || {},
      additionalInfo: formData || {},
      price,
      timeline, 
      status: 'pending',
      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application: application,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get application status
 */
export const getApplicationStatus = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;

    const application = await CAApplication.findOne({
      applicationId,
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate('serviceId', 'title')
      .lean();

    if (!application) {
      throw createError('Application not found', 404, 'NOT_FOUND');
    }

    const statusMap: Record<string, string> = {
      pending: 'Pending',
      in_review: 'In Review',
      awaiting_clarification: 'Awaiting Clarification',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    };

    const serviceTitle =
      typeof application.serviceId === 'object' && application.serviceId !== null
        ? (application.serviceId as { title?: string }).title ?? 'N/A'
        : 'N/A';

    res.json({
      success: true,
      data: {
        applicationId: application.applicationId,
        serviceTitle,
        status: application.status,
        currentStatus: statusMap[application.status] || application.status,
        timeline: application.timeline || [],
        canDownload: application.status === 'approved' && !!application.certificateNumber && application.downloadUrl,
        downloadUrl: application.downloadUrl || null,
        certificateNumber: application.certificateNumber || null,
        issuedAt: application.issuedAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user applications
 */
export const getUserApplications = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { status, serviceType, page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (status) {
      query.status = status;
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate as string);
      if (endDate) query.submittedAt.$lte = new Date(endDate as string);
    }

    const [applications, total] = await Promise.all([
      CAApplication.find(query)
        .populate('serviceId', 'title')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CAApplication.countDocuments(query),
    ]);

    // Calculate summary
    const summary = await CAApplication.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryMap: Record<string, number> = {
      totalApplications: total,
      pending: 0,
      inReview: 0,
      approved: 0,
      rejected: 0,
    };

    summary.forEach((item) => {
      if (item._id === 'pending') summaryMap.pending = item.count;
      else if (item._id === 'in_review') summaryMap.inReview = item.count;
      else if (item._id === 'approved') summaryMap.approved = item.count;
      else if (item._id === 'rejected') summaryMap.rejected = item.count;
    });

    const statusMap: Record<string, string> = {
      pending: 'Pending',
      in_review: 'In Review',
      awaiting_clarification: 'Awaiting Clarification',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    };

    res.json({
      success: true,
      data: {
        applications: applications.map((app) => ({
          id: app._id.toString(),
          applicationId: app.applicationId,
          service: (app.serviceId as any)?.title || 'N/A',
          serviceId: (app.serviceId as any)?._id?.toString() || app.serviceId?.toString(),
          status: statusMap[app.status] || app.status,
          date: new Date(app.submittedAt).toISOString().split('T')[0],
          submittedAt: app.submittedAt,
          canDownload: app.status === 'approved' || app.status === 'completed',
          certificateNumber: app.certificateNumber || null,
          price: app.price,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        summary: summaryMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download certificate/document
 */
export const downloadCertificate = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { type = 'certificate' } = req.query;
    const userId = req.user?.id;

    if (type !== 'certificate') {
      throw createError('Invalid download type', 400, 'INVALID_TYPE');
    }

    const application = await CAApplication.findOne({
      applicationId,
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!application) {
      throw createError('Application not found', 404, 'NOT_FOUND');
    }

    if (application.status !== 'approved' || 
      !application.certificateNumber || !application.downloadUrl) {
      throw createError('Certificate not available yet', 400, 'CERTIFICATE_NOT_READY');
    }


    if (type === 'certificate' && application.downloadUrl) {
      res.json({
        success: true,
        data: {
          downloadUrl: application.downloadUrl,
          fileName: `Certificate_${application.applicationId}.pdf`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    } else {
      throw createError('Download not available', 404, 'NOT_FOUND');
    }
  } catch (error) {
    next(error);
  }
};

// admin/ca controllers for CA applications can be added here

/**
 * Update application status (Admin/CA)
 */
export const updateApplicationStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { status, note, timelineUpdate } = req.body;

    // Allowed transitions
    const allowedStatuses = [
      'submitted',
      'in_review',
      'awaiting_clarification',
      'approved',
      'rejected',
      'completed',
    ];

    if (!allowedStatuses.includes(status)) {
      throw createError('Invalid status update', 400, 'INVALID_STATUS');
    }

    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    const application = await CAApplication.findOne({ applicationId });

    if (!application) {
      throw createError('Application not found', 404, 'NOT_FOUND');
    }

    const oldStatus = application.status;
    application.status = status;

    /**
     * Timeline handling
     */
    if (timelineUpdate) {
      // Mark existing current as completed
      application.timeline = application.timeline.map((entry) =>
        entry.status === 'current'
          ? { ...entry, status: 'completed' }
          : entry
      );

      // Push new current entry
      application.timeline.push({
        title: timelineUpdate.title,
        time: 'Current',
        status: 'current',
        icon: timelineUpdate.icon || 'check_circle',
        timestamp: new Date(),
        description: timelineUpdate.description || note,
      });
    }

    /**
     * Certificate generation (Approved only)
     */
    if (status === 'approved' && oldStatus !== 'approved') {
      application.certificateNumber = `CERT-${Date.now()}`;
      application.downloadUrl = `${
        process.env.BASE_URL
      }/certificates/${application.applicationId}.pdf`;
      application.issuedAt = new Date();
    }

    application.reviewedBy = new mongoose.Types.ObjectId(req.user.id);
    application.reviewedAt = new Date();

    await application.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        applicationId: application.applicationId,
        status: application.status,
        updatedAt: application.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request clarification
 */
export const requestClarification = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { message, requiredDocuments = [], deadline } = req.body;

    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    const application = await CAApplication.findOne({ applicationId });

    if (!application) {
      throw createError('Application not found', 404, 'NOT_FOUND');
    }

    application.status = 'awaiting_clarification';

    // Mark previous current timeline as completed
    application.timeline = application.timeline.map((entry) =>
      entry.status === 'current' ? { ...entry, status: 'completed' } : entry
    );

    // Add timeline entry
    application.timeline.push({
      title: 'Awaiting Clarification',
      time: 'Current',
      status: 'current',
      icon: 'info_outline',
      timestamp: new Date(),
      description: message || 'Additional information required',
    });

    // Store clarification details
    application.clarification = {
      message: message || '',
      requiredDocuments,
      requestedAt: new Date(),
      requestedBy: new mongoose.Types.ObjectId(req.user.id),
      deadline: deadline ? new Date(deadline) : undefined,
    };

    await application.save();

    res.json({
      success: true,
      data: {
        clarificationId: application.clarification,
        applicationId: application.applicationId,
        status: 'pending',
        requestedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};


/** * Get all applications (Admin/CA)
 */

export const getAllApplicationsAdmin = async (
  req: AuthRequest, 
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }
    const { status, serviceId, page = 1, limit = 20, } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query: any = {};

    if (status) {
      query.status = status;
    }
    if (serviceId) {
      query.serviceId = new mongoose.Types.ObjectId(serviceId as string);
    }
    const [applications, total] = await Promise.all([
      CAApplication.find(query)
        .populate('serviceId', 'title')
        .populate('userId', 'name email')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CAApplication.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        applications,
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

// get single application details, list all applications, etc.
export const getAllApplicationDetailsAdmin = async (
 req: AuthRequest, 
 res: Response, 
 next: NextFunction
): Promise<void> => {
  try {
   const { applicationId } = req.params;

    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

   const application = await CAApplication.findOne({ applicationId })
     .populate('serviceId', 'title')
     .populate('userId', 'name email')
     .lean();

    if (!application) {
      throw createError('Application not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        application: application,
      },
    });
  } catch (error) {
    next(error);
  }
};

/***
 * Aprove / Reject Application (Admin/CA)
 */

export const approveRejectApplicationAdmin = async (
 req: AuthRequest, 
 res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { action, note } = req.body;

    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }
    const application = await CAApplication.findOne({ applicationId });

    if (!application) {
      throw createError('Application not found', 404, 'NOT_FOUND');
    }

    if (action === 'approve') {
      application.status = 'approved';
      application.certificateNumber = `CERT-${Date.now()}`;
      application.downloadUrl = `${
        process.env.BASE_URL
      }/certificates/${application.applicationId}.pdf`;
      application.issuedAt = new Date();
      application.timeline.push({
        title: 'Approved',
        status: 'current',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        icon: 'check_circle',
        timestamp: new Date(),
        description: note || 'Application approved',
      });
    }else if (action === 'reject') {
      application.status = 'rejected';
      application.timeline.push({
        title: 'Rejected',
        status: 'current',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        icon: 'cancel',
        timestamp: new Date(),
        description: note || 'Application rejected',
      });
    }else {
      throw createError('Invalid action', 400, 'INVALID_ACTION');
    }
    application.reviewedBy = new mongoose.Types.ObjectId(req.user.id);
    application.reviewedAt = new Date();
    await application.save();

    res.json({
      success: true,
      message: `Application ${action}d successfully`,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        certificateNumber: application.certificateNumber || null,
        daownloadUrl: application.downloadUrl || null,
        updatedAt: application.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * List all form entries (Admin/CA)
 */
export const listFormEntriesAdmin = async (
 req: AuthRequest, 
 res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status,subSubcategoryId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    const query: any = {};
    if (status) query.status = status;
    if (subSubcategoryId) query.subSubcategoryId = new mongoose.Types.ObjectId(subSubcategoryId as string);

    const [entries, total] = await Promise.all([
      CAFormEntry.find(query)
        .populate('userId', 'name email')
        .populate('subSubcategoryId', 'cat_name')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CAFormEntry.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        entries,
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
 * Review form entry (Admin/CA)
 */
export const reviewFormEntryAdmin = async (
 req: AuthRequest, 
 res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { entryId } = req.params;
    const { status, note } = req.body; // status: 'approved' | 'rejected'

    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    if (!['approved', 'rejected'].includes(status)) {
      throw createError('Invalid status', 400, 'INVALID_STATUS');
    }

    const entry = await CAFormEntry.findOne({ entryId });

    if (!entry) {
      throw createError('Form entry not found', 404, 'NOT_FOUND');
    }

    entry.status = status;
    entry.reviewedBy = new mongoose.Types.ObjectId(req.user.id);
    entry.reviewedAt = new Date();
    entry.reviewNotes = note || '';

    await entry.save();
    res.json({
      success: true,
      message: `Form entry ${status} successfully`,
      data: { 
        entryId: entry.entryId,
        status: entry.status,
        reviewedBy: entry.reviewedBy,
        reviewedAt: entry.reviewedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};