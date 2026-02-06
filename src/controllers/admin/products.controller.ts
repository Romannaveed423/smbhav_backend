import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../middleware/admin';
import { Product } from '../../models/Product';
import { ClickLog } from '../../models/ClickLog';
import { Earning } from '../../models/Earning';
import { Application } from '../../models/Application';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';
import { getFileUrl } from '../../utils/fileUpload';

/**
 * List Products (Admin)
 */
export const listProducts = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, section, category, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (section) query.section = section;
    if (category) query.category = category;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        products: products.map((product) => ({
          id: product._id.toString(),
          name: product.name,
          description: product.description,
          category: product.category,
          section: product.section,
          earnUpTo: product.earnUpTo,
          taskUrl: product.taskUrl || null,
          route: product.route,
          logo: getFileUrl(req, product.logo),
          icon: getFileUrl(req, product.icon),
          isActive: product.isActive,
          isNewProduct: product.isNewProduct,
          details: product.details,
          marketing: product.marketing,
          training: product.training,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })),
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
 * Get Single Product (Admin)
 */
export const getProduct = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        section: product.section,
        earnUpTo: product.earnUpTo,
        taskUrl: product.taskUrl || null,
        route: product.route,
        logo: getFileUrl(req, product.logo),
        icon: getFileUrl(req, product.icon),
        isActive: product.isActive,
        isNewProduct: product.isNewProduct,
        details: product.details,
        marketing: product.marketing,
        training: product.training,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Product (Admin)
 */
export const createProduct = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, category, section, earnUpTo, taskUrl, route, isActive, isNewProduct, details, marketing, training } = req.body;

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const logo = files?.['logo']?.[0] ? `/uploads/earnings/products/${files['logo'][0].filename}` : req.body.logo;
    const icon = files?.['icon']?.[0] ? `/uploads/earnings/products/${files['icon'][0].filename}` : req.body.icon;

    // Parse JSON fields if they're strings
    let parsedDetails = details;
    let parsedMarketing = marketing;
    let parsedTraining = training;

    if (typeof details === 'string') {
      try {
        parsedDetails = JSON.parse(details);
      } catch (e) {
        parsedDetails = {};
      }
    }
    if (typeof marketing === 'string') {
      try {
        parsedMarketing = JSON.parse(marketing);
      } catch (e) {
        parsedMarketing = {};
      }
    }
    if (typeof training === 'string') {
      try {
        parsedTraining = JSON.parse(training);
      } catch (e) {
        parsedTraining = {};
      }
    }

    // Generate route if not provided
    const productRoute = route || `/${category}/${name.toLowerCase().replace(/\s+/g, '-')}`;

    const product = await Product.create({
      name,
      description,
      category,
      section,
      earnUpTo: Number(earnUpTo),
      taskUrl: taskUrl || undefined,
      route: productRoute,
      logo: logo || '/uploads/default-product-logo.png',
      icon: icon || '/uploads/default-product-icon.png',
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
      isNewProduct: isNewProduct === 'true' || isNewProduct === true,
      details: parsedDetails || {
        benefits: {
          payoutOpportunity: [],
          customerBenefits: [],
        },
      },
      marketing: parsedMarketing || { materials: [], links: [] },
      training: parsedTraining || { videos: [], documents: [] },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        section: product.section,
        earnUpTo: product.earnUpTo,
        route: product.route,
        logo: getFileUrl(req, product.logo),
        icon: getFileUrl(req, product.icon),
        isActive: product.isActive,
        createdAt: product.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Product (Admin)
 */
export const updateProduct = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const updateData: any = {};

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files?.['logo']?.[0]) {
      updateData.logo = `/uploads/earnings/products/${files['logo'][0].filename}`;
    } else if (req.body.logo) {
      updateData.logo = req.body.logo;
    }

    if (files?.['icon']?.[0]) {
      updateData.icon = `/uploads/earnings/products/${files['icon'][0].filename}`;
    } else if (req.body.icon) {
      updateData.icon = req.body.icon;
    }

    // Update other fields if provided
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.section) updateData.section = req.body.section;
    if (req.body.earnUpTo !== undefined) updateData.earnUpTo = Number(req.body.earnUpTo);
    if (req.body.taskUrl !== undefined) updateData.taskUrl = req.body.taskUrl || null;
    if (req.body.route) updateData.route = req.body.route;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.isNewProduct !== undefined) updateData.isNewProduct = req.body.isNewProduct === 'true' || req.body.isNewProduct === true;

    // Parse JSON fields
    if (req.body.details) {
      try {
        updateData.details = typeof req.body.details === 'string' ? JSON.parse(req.body.details) : req.body.details;
      } catch (e) {
        // Invalid JSON, skip
      }
    }
    if (req.body.marketing) {
      try {
        updateData.marketing = typeof req.body.marketing === 'string' ? JSON.parse(req.body.marketing) : req.body.marketing;
      } catch (e) {
        // Invalid JSON, skip
      }
    }
    if (req.body.training) {
      try {
        updateData.training = typeof req.body.training === 'string' ? JSON.parse(req.body.training) : req.body.training;
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        id: updatedProduct!._id.toString(),
        name: updatedProduct!.name,
        description: updatedProduct!.description,
        category: updatedProduct!.category,
        section: updatedProduct!.section,
        earnUpTo: updatedProduct!.earnUpTo,
        taskUrl: updatedProduct!.taskUrl || null,
        route: updatedProduct!.route,
        logo: getFileUrl(req, updatedProduct!.logo),
        icon: getFileUrl(req, updatedProduct!.icon),
        isActive: updatedProduct!.isActive,
        updatedAt: updatedProduct!.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Product (Admin)
 */
export const deleteProduct = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    // Check if product has active applications or earnings
    const [applicationsCount, earningsCount] = await Promise.all([
      Application.countDocuments({ productId: new mongoose.Types.ObjectId(productId) }),
      Earning.countDocuments({ productId: new mongoose.Types.ObjectId(productId) }),
    ]);

    if (applicationsCount > 0 || earningsCount > 0) {
      throw createError(
        `Cannot delete product. It has ${applicationsCount} applications and ${earningsCount} earnings associated with it.`,
        400,
        'CANNOT_DELETE'
      );
    }

    await Product.findByIdAndDelete(productId);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate Product (Admin)
 */
export const duplicateProduct = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    // Create a copy
    const productData: any = product.toObject();
    delete productData._id;
    delete productData.createdAt;
    delete productData.updatedAt;
    productData.name = `${product.name} (Copy)`;
    productData.isActive = false; // Set to inactive by default
    productData.route = `${product.route}-copy-${Date.now()}`;

    const duplicatedProduct = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product duplicated successfully',
      data: {
        id: duplicatedProduct._id.toString(),
        name: duplicatedProduct.name,
        isActive: duplicatedProduct.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Product Status (Admin)
 */
export const toggleProductStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: product._id.toString(),
        name: product.name,
        isActive: product.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Product Statistics (Admin)
 */
export const getProductStatistics = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    const dateQuery: any = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate as string);
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    const [
      totalClicks,
      convertedClicks,
      totalApplications,
      approvedApplications,
      totalEarnings,
      completedEarnings,
      totalEarningsAmount,
    ] = await Promise.all([
      ClickLog.countDocuments({ productId: productObjectId, ...dateQuery }),
      ClickLog.countDocuments({ productId: productObjectId, status: 'converted', ...dateQuery }),
      Application.countDocuments({ productId: productObjectId, ...dateQuery }),
      Application.countDocuments({ productId: productObjectId, status: 'approved', ...dateQuery }),
      Earning.countDocuments({ productId: productObjectId, ...dateQuery }),
      Earning.countDocuments({ productId: productObjectId, status: 'completed', ...dateQuery }),
      Earning.aggregate([
        {
          $match: {
            productId: productObjectId,
            status: 'completed',
            ...dateQuery,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        product: {
          id: product._id.toString(),
          name: product.name,
        },
        statistics: {
          clicks: {
            total: totalClicks,
            converted: convertedClicks,
            conversionRate: totalClicks > 0 ? ((convertedClicks / totalClicks) * 100).toFixed(2) : '0.00',
          },
          applications: {
            total: totalApplications,
            approved: approvedApplications,
            approvalRate: totalApplications > 0 ? ((approvedApplications / totalApplications) * 100).toFixed(2) : '0.00',
          },
          earnings: {
            total: totalEarnings,
            completed: completedEarnings,
            totalAmount: totalEarningsAmount[0]?.total || 0,
          },
        },
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

