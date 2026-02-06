import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CatalogCategory } from '../../models/CatalogCategory';
import { Catalog } from '../../models/Catalog';
import { createError } from '../../utils/errors';
import { getFileUrl } from '../../utils/fileUpload';
import { Request } from 'express';

/**
 * Get all catalog categories (Public endpoint for Flutter app)
 * GET /api/v1/pod/catalog-categories
 */
export const getCatalogCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await CatalogCategory.find({
      status: 'Enabled',
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get catalog counts for each category
    const categoriesData = await Promise.all(
      categories.map(async (category: any) => {
        const catalogCount = await Catalog.countDocuments({ 
          categoryId: category._id,
          status: 'Enabled',
        });
        return {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          image: getFileUrl(req as any, category.image),
          totalCatalogs: catalogCount,
          feature: category.feature,
          status: category.status,
        };
      })
    );

    res.json({
      success: true,
      data: categoriesData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get catalogs by category (Public endpoint for Flutter app)
 * GET /api/v1/pod/catalog-categories/:categoryId/catalogs
 */
export const getCatalogsByCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;

    // Verify category exists and is enabled
    const category = await CatalogCategory.findById(categoryId).lean();
    if (!category) {
      throw createError('Catalog category not found', 404, 'NOT_FOUND');
    }
    if (category.status !== 'Enabled') {
      throw createError('Catalog category is not available', 404, 'NOT_FOUND');
    }

    const catalogs = await Catalog.find({
      categoryId: categoryId,
      status: 'Enabled',
    })
      .sort({ createdAt: -1 })
      .lean();

    const catalogsData = catalogs.map((catalog: any) => ({
      id: catalog._id.toString(),
      name: catalog.name,
      slug: catalog.slug,
      categoryId: categoryId,
      categoryName: category.name,
      image: getFileUrl(req, catalog.image),
      status: catalog.status,
    }));

    res.json({
      success: true,
      data: catalogsData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single catalog details (Public endpoint for Flutter app)
 * GET /api/v1/pod/catalogs/:catalogId
 */
export const getCatalogDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { catalogId } = req.params;

    const catalog = await Catalog.findById(catalogId)
      .populate('categoryId', 'name')
      .lean();

    if (!catalog) {
      throw createError('Catalog not found', 404, 'NOT_FOUND');
    }

    if (catalog.status !== 'Enabled') {
      throw createError('Catalog is not available', 404, 'NOT_FOUND');
    }

    const category = catalog.categoryId as any;

    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    next(error);
  }
};

