import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../../middleware/admin';
import { PODDesign } from '../../../models/PODDesign';
import { createError } from '../../../utils/errors';
import mongoose from 'mongoose';
import { getFileUrl } from '../../../utils/fileUpload';

/**
 * List POD Designs (Admin)
 * GET /api/v1/admin/pod/designs
 */
export const listPODDesigns = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (status) {
      query.status = status;
    } else {
      // Default to pending if no status specified
      query.status = 'pending';
    }

    const [designs, total] = await Promise.all([
      PODDesign.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PODDesign.countDocuments(query),
    ]);

    const designsData = designs.map((design: any) => {
      const user = design.userId;
      return {
        id: design._id.toString(),
        userId: user?._id?.toString() || design.userId?.toString(),
        userName: user?.name || 'Unknown',
        productType: design.productType || null,
        designUrl: getFileUrl(req, design.designUrl),
        status: design.status || 'pending',
        submittedDate: design.uploadedAt || design.createdAt,
        approvedDate: design.approvedDate || null,
        rejectedDate: design.rejectedDate || null,
        rejectionReason: design.rejectionReason || null,
      };
    });

    res.json({
      success: true,
      data: {
        designs: designsData,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single POD Design (Admin)
 * GET /api/v1/admin/pod/designs/:designId
 */
export const getPODDesign = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { designId } = req.params;

    const design = await PODDesign.findById(designId).populate('userId', 'name email').lean();

    if (!design) {
      throw createError('Design not found', 404, 'NOT_FOUND');
    }

    const user = design.userId as any;

    res.json({
      success: true,
      data: {
        design: {
          id: design._id.toString(),
          userId: user?._id?.toString() || design.userId?.toString(),
          userName: user?.name || 'Unknown',
          productType: design.productType || null,
          designUrl: getFileUrl(req, design.designUrl),
          status: design.status || 'pending',
          submittedDate: design.uploadedAt || design.createdAt,
          approvedDate: design.approvedDate || null,
          rejectedDate: design.rejectedDate || null,
          rejectionReason: design.rejectionReason || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve Design (Admin)
 * POST /api/v1/admin/pod/designs/:designId/approve
 */
export const approvePODDesign = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { designId } = req.params;
    const adminId = req.admin?.id;

    if (!adminId) {
      throw createError('Admin authentication required', 401, 'UNAUTHORIZED');
    }

    const design = await PODDesign.findById(designId);

    if (!design) {
      throw createError('Design not found', 404, 'NOT_FOUND');
    }

    design.status = 'approved';
    design.approvedDate = new Date();
    design.approvedBy = new mongoose.Types.ObjectId(adminId);

    await design.save();

    res.json({
      success: true,
      message: 'Design approved successfully',
      data: {
        design: {
          id: design._id.toString(),
          status: design.status,
          approvedDate: design.approvedDate,
          approvedBy: design.approvedBy?.toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject Design (Admin)
 * POST /api/v1/admin/pod/designs/:designId/reject
 */
export const rejectPODDesign = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { designId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin?.id;

    if (!adminId) {
      throw createError('Admin authentication required', 401, 'UNAUTHORIZED');
    }

    const design = await PODDesign.findById(designId);

    if (!design) {
      throw createError('Design not found', 404, 'NOT_FOUND');
    }

    design.status = 'rejected';
    design.rejectedDate = new Date();
    design.rejectionReason = reason;
    design.rejectedBy = new mongoose.Types.ObjectId(adminId);

    await design.save();

    res.json({
      success: true,
      message: 'Design rejected successfully',
      data: {
        design: {
          id: design._id.toString(),
          status: design.status,
          rejectionReason: design.rejectionReason,
          rejectedDate: design.rejectedDate,
          rejectedBy: design.rejectedBy?.toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

