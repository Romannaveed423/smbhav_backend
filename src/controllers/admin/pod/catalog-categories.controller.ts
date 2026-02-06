import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../../middleware/admin';
import { CatalogCategory } from '../../../models/CatalogCategory';
import { Catalog } from '../../../models/Catalog';
import { createError } from '../../../utils/errors';
import mongoose from 'mongoose';
import { getFileUrl } from '../../../utils/fileUpload';

/**
 * List Catalog Categories (Admin)
 * GET /api/v1/admin/pod/catalog-categories
 */
export const listCatalogCategories = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, feature, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (feature) {
      query.feature = feature;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.name = { $regex: search as string, $options: 'i' };
    }

    const [categories, total] = await Promise.all([
      CatalogCategory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CatalogCategory.countDocuments(query),
    ]);

    // Get catalog counts for each category
    const categoriesData = await Promise.all(
      categories.map(async (category: any) => {
        const catalogCount = await Catalog.countDocuments({ categoryId: category._id });
        return {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          image: getFileUrl(req, category.image),
          totalCatalogs: catalogCount,
          feature: category.feature,
          status: category.status,
          seoTitle: category.seoTitle || null,
          seoDescription: category.seoDescription || null,
          seoKeywords: category.seoKeywords || null,
          createdAt: category.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: {
        categories: categoriesData,
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
 * Get Single Catalog Category (Admin)
 * GET /api/v1/admin/pod/catalog-categories/:categoryId
 */
export const getCatalogCategory = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;

    const category = await CatalogCategory.findById(categoryId).lean();

    if (!category) {
      throw createError('Category not found', 404, 'NOT_FOUND');
    }

    const catalogCount = await Catalog.countDocuments({ categoryId });

    res.json({
      success: true,
      data: {
        category: {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          image: getFileUrl(req, category.image),
          totalCatalogs: catalogCount,
          feature: category.feature,
          status: category.status,
          seoTitle: category.seoTitle || null,
          seoDescription: category.seoDescription || null,
          seoKeywords: category.seoKeywords || null,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Catalog Category (Admin)
 * POST /api/v1/admin/pod/catalog-categories
 */
export const createCatalogCategory = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug, description, feature, seoTitle, seoDescription, seoKeywords} = req.body;

    // Handle file upload - .single() puts file in req.file, not req.files
    const file = req.file as Express.Multer.File | undefined;
    let imagePath = '';
    
    if (file) {
      imagePath = `/uploads/pod/catalog-categories/${file.filename}`;
    } else {
      throw createError('Image is required', 400, 'VALIDATION_ERROR');
    }

    // Check if slug already exists
    const existingCategory = await CatalogCategory.findOne({ slug });
    if (existingCategory) {
      throw createError('Category with this slug already exists', 409, 'DUPLICATE_ENTRY');
    }

    const category = await CatalogCategory.create({
      name,
      slug: slug.toLowerCase(),
      description: description || null,
      image: imagePath,
      feature,
      status: 'Enabled',
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
    });

    res.status(201).json({
      success: true,
      message: 'Catalog category created successfully',
      data: {
        category: {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          image: getFileUrl(req, category.image),
          feature: category.feature,
          status: category.status,
          totalCatalogs: 0,
          createdAt: category.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Catalog Category (Admin)
 * PUT /api/v1/admin/pod/catalog-categories/:categoryId
 */
export const updateCatalogCategory = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { name, slug, description, feature, seoTitle, seoDescription, seoKeywords } = req.body;

    const category = await CatalogCategory.findById(categoryId);

    if (!category) {
      throw createError('Category not found', 404, 'NOT_FOUND');
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (slug) {
      // Check if slug already exists (except for current category)
      const existingCategory = await CatalogCategory.findOne({ slug: slug.toLowerCase(), _id: { $ne: categoryId } });
      if (existingCategory) {
        throw createError('Category with this slug already exists', 409, 'DUPLICATE_ENTRY');
      }
      updateData.slug = slug.toLowerCase();
    }
    if (description !== undefined) updateData.description = description || null;
    if (feature) updateData.feature = feature;

    // Handle file upload if image provided - .single() puts file in req.file, not req.files
    const file = req.file as Express.Multer.File | undefined;
    if (file) {
      updateData.image = `/uploads/pod/catalog-categories/${file.filename}`;
    }

    if (seoTitle !== undefined) updateData.seoTitle = seoTitle || null;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription || null;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords || null;

    const updatedCategory = await CatalogCategory.findByIdAndUpdate(categoryId, updateData, { new: true });

    res.json({
      success: true,
      message: 'Catalog category updated successfully',
      data: {
        category: {
          id: updatedCategory!._id.toString(),
          name: updatedCategory!.name,
          updatedAt: updatedCategory!.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Catalog Category Status (Admin)
 * PUT /api/v1/admin/pod/catalog-categories/:categoryId/status
 */
export const toggleCatalogCategoryStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { status } = req.body;

    const category = await CatalogCategory.findByIdAndUpdate(categoryId, { status }, { new: true });

    if (!category) {
      throw createError('Category not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Category status updated successfully',
      data: {
        category: {
          id: category._id.toString(),
          status: category.status,
          updatedAt: category.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Catalog Category SEO Settings (Admin)
 * PUT /api/v1/admin/pod/catalog-categories/:categoryId/seo
 */
export const updateCatalogCategorySEO = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { seoTitle, seoDescription, seoKeywords } = req.body;

    const updateData: any = {};
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle || null;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription || null;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords || null;

    const category = await CatalogCategory.findByIdAndUpdate(categoryId, updateData, { new: true });

    if (!category) {
      throw createError('Category not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'SEO settings updated successfully',
      data: {
        category: {
          id: category._id.toString(),
          seoTitle: category.seoTitle,
          seoDescription: category.seoDescription,
          seoKeywords: category.seoKeywords,
          updatedAt: category.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Catalog Category (Admin)
 * DELETE /api/v1/admin/pod/catalog-categories/:categoryId
 */
export const deleteCatalogCategory = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;

    // Check if category has associated catalogs
    const catalogCount = await Catalog.countDocuments({ categoryId });
    if (catalogCount > 0) {
      throw createError('Cannot delete category with associated catalogs', 400, 'CATEGORY_IN_USE');
    }

    const category = await CatalogCategory.findByIdAndDelete(categoryId);

    if (!category) {
      throw createError('Category not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Catalog category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

