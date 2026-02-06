import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../../middleware/admin';
import { Catalog } from '../../../models/Catalog';
import { CatalogCategory } from '../../../models/CatalogCategory';
import { createError } from '../../../utils/errors';
import mongoose from 'mongoose';
import { getFileUrl } from '../../../utils/fileUpload';

/**
 * List Catalogs (Admin)
 * GET /api/v1/admin/pod/catalogs
 */
export const listCatalogs = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, categoryId, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (categoryId) {
      query.categoryId = new mongoose.Types.ObjectId(categoryId as string);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { slug: { $regex: search as string, $options: 'i' } },
      ];
    }

    const [catalogs, total] = await Promise.all([
      Catalog.find(query)
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Catalog.countDocuments(query),
    ]);

    const catalogsData = catalogs.map((catalog: any) => {
      const category = catalog.categoryId;
      return {
        id: catalog._id.toString(),
        name: catalog.name,
        slug: catalog.slug,
        categoryId: category?._id?.toString() || catalog.categoryId?.toString(),
        categoryName: category?.name || null,
        image: getFileUrl(req, catalog.image),
        status: catalog.status,
        createdAt: catalog.createdAt,
        seoTitle: catalog.seoTitle || null,
        seoDescription: catalog.seoDescription || null,
        seoKeywords: catalog.seoKeywords || null,
      };
    });

    res.json({
      success: true,
      data: {
        catalogs: catalogsData,
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
 * Get Single Catalog (Admin)
 * GET /api/v1/admin/pod/catalogs/:catalogId
 */
export const getCatalog = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { catalogId } = req.params;

    const catalog = await Catalog.findById(catalogId).populate('categoryId', 'name').lean();

    if (!catalog) {
      throw createError('Catalog not found', 404, 'NOT_FOUND');
    }

    const category = catalog.categoryId as any;

    res.json({
      success: true,
      data: {
        catalog: {
          id: catalog._id.toString(),
          name: catalog.name,
          slug: catalog.slug,
          categoryId: category?._id?.toString() || catalog.categoryId?.toString(),
          categoryName: category?.name || null,
          image: getFileUrl(req, catalog.image),
          status: catalog.status,
          seoTitle: catalog.seoTitle || null,
          seoDescription: catalog.seoDescription || null,
          seoKeywords: catalog.seoKeywords || null,
          createdAt: catalog.createdAt,
          updatedAt: catalog.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Catalog (Admin)
 * POST /api/v1/admin/pod/catalogs
 */
export const createCatalog = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId, name, slug, seoTitle, seoDescription, seoKeywords } = req.body;

    // Validate category exists
    const category = await CatalogCategory.findById(categoryId);
    if (!category) {
      throw createError('Category not found', 404, 'NOT_FOUND');
    }

    // Handle file upload - .single() puts file in req.file, not req.files
    const file = req.file as Express.Multer.File | undefined;
    let imagePath = '';
    
    if (file) {
      imagePath = `/uploads/pod/catalogs/${file.filename}`;
    } else {
      throw createError('Image is required', 400, 'VALIDATION_ERROR');
    }

    // Check if slug already exists
    const existingCatalog = await Catalog.findOne({ slug });
    if (existingCatalog) {
      throw createError('Catalog with this slug already exists', 409, 'DUPLICATE_ENTRY');
    }

    const catalog = await Catalog.create({
      name,
      slug: slug.toLowerCase(),
      categoryId: new mongoose.Types.ObjectId(categoryId),
      image: imagePath,
      status: 'Enabled',
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
    });

    res.status(201).json({
      success: true,
      message: 'Catalog created successfully',
      data: {
        catalog: {
          id: catalog._id.toString(),
          name: catalog.name,
          slug: catalog.slug,
          categoryId: catalog.categoryId.toString(),
          image: getFileUrl(req, catalog.image),
          status: catalog.status,
          createdAt: catalog.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Catalog (Admin)
 * PUT /api/v1/admin/pod/catalogs/:catalogId
 */
export const updateCatalog = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { catalogId } = req.params;
    const { name, slug, categoryId, seoTitle, seoDescription, seoKeywords } = req.body;

    const catalog = await Catalog.findById(catalogId);

    if (!catalog) {
      throw createError('Catalog not found', 404, 'NOT_FOUND');
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (slug) {
      // Check if slug already exists (except for current catalog)
      const existingCatalog = await Catalog.findOne({ slug: slug.toLowerCase(), _id: { $ne: catalogId } });
      if (existingCatalog) {
        throw createError('Catalog with this slug already exists', 409, 'DUPLICATE_ENTRY');
      }
      updateData.slug = slug.toLowerCase();
    }
    if (categoryId) {
      // Validate category exists
      const category = await CatalogCategory.findById(categoryId);
      if (!category) {
        throw createError('Category not found', 404, 'NOT_FOUND');
      }
      updateData.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    // Handle file upload if image provided - .single() puts file in req.file, not req.files
    const file = req.file as Express.Multer.File | undefined;
    if (file) {
      updateData.image = `/uploads/pod/catalogs/${file.filename}`;
    }

    if (seoTitle !== undefined) updateData.seoTitle = seoTitle || null;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription || null;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords || null;

    const updatedCatalog = await Catalog.findByIdAndUpdate(catalogId, updateData, { new: true });

    res.json({
      success: true,
      message: 'Catalog updated successfully',
      data: {
        catalog: {
          id: updatedCatalog!._id.toString(),
          name: updatedCatalog!.name,
          updatedAt: updatedCatalog!.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Catalog Status (Admin)
 * PUT /api/v1/admin/pod/catalogs/:catalogId/status
 */
export const toggleCatalogStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { catalogId } = req.params;
    const { status } = req.body;

    const catalog = await Catalog.findByIdAndUpdate(catalogId, { status }, { new: true });

    if (!catalog) {
      throw createError('Catalog not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Catalog status updated successfully',
      data: {
        catalog: {
          id: catalog._id.toString(),
          status: catalog.status,
          updatedAt: catalog.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Catalog SEO Settings (Admin)
 * PUT /api/v1/admin/pod/catalogs/:catalogId/seo
 */
export const updateCatalogSEO = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { catalogId } = req.params;
    const { seoTitle, seoDescription, seoKeywords } = req.body;

    const updateData: any = {};
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle || null;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription || null;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords || null;

    const catalog = await Catalog.findByIdAndUpdate(catalogId, updateData, { new: true });

    if (!catalog) {
      throw createError('Catalog not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'SEO settings updated successfully',
      data: {
        catalog: {
          id: catalog._id.toString(),
          seoTitle: catalog.seoTitle,
          seoDescription: catalog.seoDescription,
          seoKeywords: catalog.seoKeywords,
          updatedAt: catalog.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Catalog (Admin)
 * DELETE /api/v1/admin/pod/catalogs/:catalogId
 */
export const deleteCatalog = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { catalogId } = req.params;

    const catalog = await Catalog.findByIdAndDelete(catalogId);

    if (!catalog) {
      throw createError('Catalog not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Catalog deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

