import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../middleware/admin';
import { OfferApplication } from '../../models/OfferApplication';
import { Offer } from '../../models/Offer';
import { User } from '../../models/User';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * List Offer Applications (Admin)
 * GET /api/v1/admin/earn/offer-applications
 */
export const listOfferApplications = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, search, offerId, publisherId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Offer ID filter
    if (offerId) {
      query.offerId = new mongoose.Types.ObjectId(offerId as string);
    }

    // Publisher ID filter
    if (publisherId) {
      query.publisherId = new mongoose.Types.ObjectId(publisherId as string);
    }

    // Search filter
    if (search) {
      query.$or = [
        { offerName: { $regex: search as string, $options: 'i' } },
        { publisherName: { $regex: search as string, $options: 'i' } },
      ];
    }

    // Get applications with pagination
    const [applications, total] = await Promise.all([
      OfferApplication.find(query)
        .populate('offerId', 'name description category status imageUrl icon')
        .populate('publisherId', 'name email phone')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      OfferApplication.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    // Map applications to response format
    const applicationsData = applications.map((app) => ({
      _id: app._id.toString(),
      offerId: app.offerId ? (app.offerId as any)._id?.toString() || app.offerId.toString() : null,
      offerName: app.offerName,
      publisherId: app.publisherId ? (app.publisherId as any)._id?.toString() || app.publisherId.toString() : null,
      publisherName: app.publisherName,
      publisherEmail: app.publisherEmail,
      offerPromotion: app.offerPromotion,
      status: app.status,
      rejectionReason: app.rejectionReason || null,
      approvedBy: app.approvedBy ? (app.approvedBy as any)._id?.toString() || app.approvedBy.toString() : null,
      approvedAt: app.approvedAt || null,
      notes: app.notes || null,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    res.json({
      success: true,
      data: {
        applications: applicationsData,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Offer Application (Admin)
 * GET /api/v1/admin/earn/offer-applications/:applicationId
 */
export const getOfferApplication = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;

    const application = await OfferApplication.findById(applicationId)
      .populate('offerId')
      .populate('publisherId')
      .populate('approvedBy', 'name email');

    if (!application) {
      throw createError('Offer application not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        application: {
          _id: application._id.toString(),
          offerId: application.offerId ? (application.offerId as any)._id?.toString() || application.offerId.toString() : null,
          offerName: application.offerName,
          offer: application.offerId,
          publisherId: application.publisherId ? (application.publisherId as any)._id?.toString() || application.publisherId.toString() : null,
          publisherName: application.publisherName,
          publisherEmail: application.publisherEmail,
          publisher: application.publisherId,
          offerPromotion: application.offerPromotion,
          status: application.status,
          rejectionReason: application.rejectionReason || null,
          approvedBy: application.approvedBy ? (application.approvedBy as any)._id?.toString() || application.approvedBy.toString() : null,
          approvedAt: application.approvedAt || null,
          notes: application.notes || null,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Offer Application Status (Admin)
 * PUT /api/v1/admin/earn/offer-applications/:applicationId/status
 */
export const updateOfferApplicationStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { status, rejectionReason, notes } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw createError('Admin ID not found', 401, 'UNAUTHORIZED');
    }

    const application = await OfferApplication.findById(applicationId);
    if (!application) {
      throw createError('Offer application not found', 404, 'NOT_FOUND');
    }

    // Cannot change status from Rejected to Approved (must create new application)
    if (application.status === 'Rejected' && status === 'Approved') {
      throw createError('Cannot change status from Rejected to Approved. Please create a new application.', 400, 'VALIDATION_ERROR');
    }

    // Update application
    application.status = status;
    application.approvedBy = new mongoose.Types.ObjectId(adminId);
    application.approvedAt = new Date();
    if (rejectionReason) application.rejectionReason = rejectionReason;
    if (notes) application.notes = notes;

    await application.save();

    res.json({
      success: true,
      message: `Offer application ${status.toLowerCase()} successfully`,
      data: {
        application: {
          _id: application._id.toString(),
          status: application.status,
          approvedBy: application.approvedBy.toString(),
          approvedAt: application.approvedAt,
          notes: application.notes || null,
          rejectionReason: application.rejectionReason || null,
          updatedAt: application.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate Offer Application (Admin)
 * PUT /api/v1/admin/earn/offer-applications/:applicationId/activate
 */
export const activateOfferApplication = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;

    const application = await OfferApplication.findById(applicationId);
    if (!application) {
      throw createError('Offer application not found', 404, 'NOT_FOUND');
    }

    // Application must be Approved to activate
    if (application.status !== 'Approved') {
      throw createError('Only approved applications can be activated', 400, 'VALIDATION_ERROR');
    }

    application.status = 'Active';
    await application.save();

    res.json({
      success: true,
      message: 'Offer application activated successfully',
      data: {
        application: {
          _id: application._id.toString(),
          status: application.status,
          updatedAt: application.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Offer Application (Admin)
 * DELETE /api/v1/admin/earn/offer-applications/:applicationId
 */
export const deleteOfferApplication = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;

    const application = await OfferApplication.findById(applicationId);
    if (!application) {
      throw createError('Offer application not found', 404, 'NOT_FOUND');
    }

    // Cannot delete active applications
    if (application.status === 'Active') {
      throw createError('Cannot delete active application. Please deactivate first.', 400, 'VALIDATION_ERROR');
    }

    await OfferApplication.findByIdAndDelete(applicationId);

    res.json({
      success: true,
      message: 'Offer application deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Update Offer Application Status (Admin)
 * POST /api/v1/admin/earn/offer-applications/bulk-status
 */
export const bulkUpdateOfferApplicationStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationIds, status, notes } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw createError('Admin ID not found', 401, 'UNAUTHORIZED');
    }

    const objectIds = applicationIds.map((id: string) => new mongoose.Types.ObjectId(id));

    // Find all applications
    const applications = await OfferApplication.find({ _id: { $in: objectIds } });

    if (applications.length === 0) {
      throw createError('No applications found', 404, 'NOT_FOUND');
    }

    // Update applications
    const updateData: any = {
      status,
      approvedBy: new mongoose.Types.ObjectId(adminId),
      approvedAt: new Date(),
    };

    if (notes) {
      // For bulk rejections, notes can serve as rejection reason
      if (status === 'Rejected') {
        updateData.rejectionReason = notes;
      } else {
        updateData.notes = notes;
      }
    }

    const result = await OfferApplication.updateMany(
      { _id: { $in: objectIds } },
      updateData
    );

    // Get updated applications
    const updatedApplications = await OfferApplication.find({ _id: { $in: objectIds } });

    res.json({
      success: true,
      message: `${result.modifiedCount} offer applications updated successfully`,
      data: {
        updated: result.modifiedCount,
        failed: applications.length - result.modifiedCount,
        applications: updatedApplications.map((app) => ({
          _id: app._id.toString(),
          status: app.status,
          updatedAt: app.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

