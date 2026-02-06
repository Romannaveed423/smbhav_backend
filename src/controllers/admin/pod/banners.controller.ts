import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../../middleware/admin';
import { PODBanner } from '../../../models/PODBanner';
import { createError } from '../../../utils/errors';
import { getFileUrl } from '../../../utils/fileUpload';

/**
 * List POD Banners (Admin)
 * GET /api/v1/admin/pod/banners
 */
export const listPODBanners = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (type && (type === 'carousel' || type === 'promotional')) {
      query.type = type;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const [banners, total] = await Promise.all([
      PODBanner.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PODBanner.countDocuments(query),
    ]);

    const bannersData = banners.map((banner: any) => ({
      id: banner._id.toString(),
      title: banner.title,
      subtitle: banner.subtitle || null,
      type: banner.type,
      banner: banner.banner ? getFileUrl(req, banner.banner) : null,
      imageUrl: banner.imageUrl ? getFileUrl(req, banner.imageUrl) : null,
      backgroundColor: banner.backgroundColor || null,
      link: banner.link || null,
      order: banner.order || 0,
      isActive: banner.isActive ?? true,
      startDate: banner.startDate || null,
      endDate: banner.endDate || null,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    }));

    res.json({
      success: true,
      data: {
        banners: bannersData,
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
 * Get POD Banner (Admin)
 * GET /api/v1/admin/pod/banners/:bannerId
 */
export const getPODBanner = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bannerId } = req.params;

    const banner = await PODBanner.findById(bannerId).lean();

    if (!banner) {
      throw createError('Banner not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        banner: {
          id: banner._id.toString(),
          title: banner.title,
          subtitle: banner.subtitle || null,
          type: banner.type,
          banner: banner.banner ? getFileUrl(req, banner.banner) : null,
          imageUrl: banner.imageUrl ? getFileUrl(req, banner.imageUrl) : null,
          backgroundColor: banner.backgroundColor || null,
          link: banner.link || null,
          order: banner.order || 0,
          isActive: banner.isActive ?? true,
          startDate: banner.startDate || null,
          endDate: banner.endDate || null,
          createdAt: banner.createdAt,
          updatedAt: banner.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create POD Banner (Admin)
 * POST /api/v1/admin/pod/banners
 */
export const createPODBanner = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, subtitle, type, link, order, isActive, backgroundColor, startDate, endDate } = req.body;

    if (!title || !type) {
      throw createError('Title and type are required', 400, 'VALIDATION_ERROR');
    }

    if (type !== 'carousel' && type !== 'promotional') {
      throw createError('Type must be either "carousel" or "promotional"', 400, 'VALIDATION_ERROR');
    }

    // Handle file uploads
    const uploadedFile = req.file as Express.Multer.File | undefined;
    let bannerUrl: string | undefined;
    let imageUrl: string | undefined;

    if (uploadedFile) {
      const filePath = `/uploads/pod/banners/${uploadedFile.filename}`;
      if (type === 'carousel') {
        bannerUrl = filePath;
      } else {
        imageUrl = filePath;
      }
    }

    // Validate that carousel banners have banner image
    if (type === 'carousel' && !bannerUrl) {
      throw createError('Banner image is required for carousel type', 400, 'VALIDATION_ERROR');
    }

    const banner = await PODBanner.create({
      title,
      subtitle: subtitle || undefined,
      type,
      banner: bannerUrl,
      imageUrl: imageUrl || undefined,
      backgroundColor: backgroundColor || undefined,
      link: link || undefined,
      order: order ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive === true || isActive === 'true' : true,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: {
        banner: {
          id: banner._id.toString(),
          title: banner.title,
          subtitle: banner.subtitle || null,
          type: banner.type,
          banner: banner.banner ? getFileUrl(req, banner.banner) : null,
          imageUrl: banner.imageUrl ? getFileUrl(req, banner.imageUrl) : null,
          backgroundColor: banner.backgroundColor || null,
          link: banner.link || null,
          order: banner.order || 0,
          isActive: banner.isActive ?? true,
          startDate: banner.startDate || null,
          endDate: banner.endDate || null,
          createdAt: banner.createdAt,
          updatedAt: banner.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update POD Banner (Admin)
 * PUT /api/v1/admin/pod/banners/:bannerId
 */
export const updatePODBanner = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bannerId } = req.params;
    const { title, subtitle, type, link, order, isActive, backgroundColor, startDate, endDate } = req.body;

    const banner = await PODBanner.findById(bannerId);

    if (!banner) {
      throw createError('Banner not found', 404, 'NOT_FOUND');
    }

    // Handle file uploads
    const uploadedFile = req.file as Express.Multer.File | undefined;
    if (uploadedFile) {
      const filePath = `/uploads/pod/banners/${uploadedFile.filename}`;
      if (banner.type === 'carousel') {
        banner.banner = filePath;
      } else {
        banner.imageUrl = filePath;
      }
    }

    // Update fields
    if (title) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle || undefined;
    if (type && (type === 'carousel' || type === 'promotional')) {
      banner.type = type;
    }
    if (link !== undefined) banner.link = link || undefined;
    if (order !== undefined) banner.order = Number(order);
    if (isActive !== undefined) banner.isActive = isActive === true || isActive === 'true';
    if (backgroundColor !== undefined) banner.backgroundColor = backgroundColor || undefined;
    if (startDate !== undefined) banner.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) banner.endDate = endDate ? new Date(endDate) : undefined;

    await banner.save();

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: {
        banner: {
          id: banner._id.toString(),
          title: banner.title,
          subtitle: banner.subtitle || null,
          type: banner.type,
          banner: banner.banner ? getFileUrl(req, banner.banner) : null,
          imageUrl: banner.imageUrl ? getFileUrl(req, banner.imageUrl) : null,
          backgroundColor: banner.backgroundColor || null,
          link: banner.link || null,
          order: banner.order || 0,
          isActive: banner.isActive ?? true,
          startDate: banner.startDate || null,
          endDate: banner.endDate || null,
          createdAt: banner.createdAt,
          updatedAt: banner.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete POD Banner (Admin)
 * DELETE /api/v1/admin/pod/banners/:bannerId
 */
export const deletePODBanner = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bannerId } = req.params;

    const banner = await PODBanner.findByIdAndDelete(bannerId);

    if (!banner) {
      throw createError('Banner not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle POD Banner Status (Admin)
 * PUT /api/v1/admin/pod/banners/:bannerId/status
 */
export const togglePODBannerStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bannerId } = req.params;

    const banner = await PODBanner.findById(bannerId);

    if (!banner) {
      throw createError('Banner not found', 404, 'NOT_FOUND');
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        banner: {
          id: banner._id.toString(),
          isActive: banner.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

