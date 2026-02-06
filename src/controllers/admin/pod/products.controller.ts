import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../../middleware/admin';
import { PODProduct } from '../../../models/PODProduct';
import { PODCategory } from '../../../models/PODCategory';
import { createError } from '../../../utils/errors';
import { getFileUrl } from '../../../utils/fileUpload';
import mongoose from 'mongoose';

/**
 * List POD Products (Admin)
 * GET /api/v1/admin/pod/products
 */
export const listPODProducts = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (type) {
      query.productType = type;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const [products, total] = await Promise.all([
      PODProduct.find(query)
        .populate('categoryId', 'cat_name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PODProduct.countDocuments(query),
    ]);

    const productsData = products.map((product: any) => ({
      id: product._id.toString(),
      name: product.name,
      type: product.productType || null,
      variants: product.sizes?.map((size: any) => ({
        size: size.size,
        color: null, // Colors are separate array
        material: product.materials?.[0] || null,
        price: size.price || product.price,
        stock: product.stock?.quantity || 0,
      })) || [],
      colors: product.colors || [],
      basePrice: product.price,
      status: product.isActive ? 'active' : 'inactive',
      images: product.imageUrls?.map((img: string) => getFileUrl(req, img)) || [],
      createdAt: product.createdAt,
    }));

    res.json({
      success: true,
      data: {
        products: productsData,
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
 * Get Single POD Product (Admin)
 * GET /api/v1/admin/pod/products/:productId
 */
export const getPODProduct = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await PODProduct.findById(productId)
      .populate('categoryId', 'cat_name')
      .populate('subcategoryId', 'cat_name')
      .lean();

    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        product: {
          id: product._id.toString(),
          name: product.name,
          type: product.productType || null,
          variants: product.sizes?.map((size: any) => ({
            size: size.size,
            color: null,
            material: product.materials?.[0] || null,
            price: size.price || product.price,
            stock: product.stock?.quantity || 0,
          })) || [],
          colors: product.colors || [],
          basePrice: product.price,
          status: product.isActive ? 'active' : 'inactive',
          images: product.imageUrls?.map((img: string) => getFileUrl(req, img)) || [],
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create POD Product (Admin)
 * POST /api/v1/admin/pod/products
 */
export const createPODProduct = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, type, variants, basePrice, status, images, categoryId } = req.body;

    // Handle file uploads - multer.array() puts files directly in req.files as an array
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;
    let imageUrls: string[] = [];
    
    // Check if files were uploaded via multer
    if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
      imageUrls = uploadedFiles.map((file) => `/uploads/pod/products/${file.filename}`);
    } else if (images && Array.isArray(images) && images.length > 0) {
      // Fallback: if images are provided as URLs in body
      imageUrls = images;
    }

    // Validate thumbnail requirement
    if (!imageUrls || imageUrls.length === 0) {
      throw createError('At least one product image is required', 400, 'VALIDATION_ERROR');
    }

    // Get or create default category if categoryId not provided
    let finalCategoryId: mongoose.Types.ObjectId;
    if (categoryId) {
      // Validate categoryId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw createError('Invalid category ID', 400, 'VALIDATION_ERROR');
      }
      // Verify category exists
      const category = await PODCategory.findById(categoryId);
      if (!category) {
        throw createError('Category not found', 404, 'NOT_FOUND');
      }
      finalCategoryId = new mongoose.Types.ObjectId(categoryId);
    } else {
      // Get first active category as default, or create one if none exists
      let defaultCategory = await PODCategory.findOne({ status: 1, parentCategoryId: { $exists: false } });
      if (!defaultCategory) {
        // Create a default category
        defaultCategory = await PODCategory.create({
          cat_name: 'General',
          cat_img: '/uploads/default-category.jpg',
          status: 1,
          order: 0,
        });
      }
      finalCategoryId = defaultCategory._id;
    }

    // Parse variants if it's a JSON string (from FormData) - validation should handle this, but keep as fallback
    let parsedVariants = variants;
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (e) {
        parsedVariants = [];
      }
    }

    // Ensure basePrice is a number (validation should handle this, but ensure type safety)
    const numericBasePrice = typeof basePrice === 'string' ? Number(basePrice) : (basePrice || 0);

    // Convert variants to sizes array format used by PODProduct model
    const sizes = (parsedVariants && Array.isArray(parsedVariants)) ? parsedVariants.map((v: any) => ({
      size: v.size || 'M',
      isAvailable: true,
      price: v.price || numericBasePrice,
    })) : [];

    // Generate productId before creating (required field, pre-save hook might not run before validation)
    const productCount = await PODProduct.countDocuments();
    const productId = `PROD${String(productCount + 1).padStart(6, '0')}`;

    const product = await PODProduct.create({
      productId, // Set explicitly to avoid validation error
      name,
      categoryId: finalCategoryId,
      productType: type,
      price: numericBasePrice,
      discountPrice: numericBasePrice,
      description: name,
      shortDescription: name,
      imageUrls,
      thumbnail: imageUrls[0], // First image as thumbnail (required field)
      colors: [],
      sizes,
      isActive: status !== 'inactive',
      stock: {
        inStock: true,
        quantity: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product: {
          id: product._id.toString(),
          name: product.name,
          type: product.productType || null,
          variants: sizes,
          basePrice: product.price,
          status: product.isActive ? 'active' : 'inactive',
          images: product.imageUrls.map((img) => getFileUrl(req, img)),
          createdAt: product.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update POD Product (Admin)
 * PUT /api/v1/admin/pod/products/:productId
 */
export const updatePODProduct = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const { name, basePrice, status, variants, type } = req.body;

    const product = await PODProduct.findById(productId);

    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (type) updateData.productType = type;
    if (basePrice !== undefined) {
      updateData.price = Number(basePrice);
      updateData.discountPrice = Number(basePrice);
    }
    if (status !== undefined) {
      updateData.isActive = status === 'active';
    }

    // Handle variants if provided
    if (variants !== undefined) {
      // Parse variants if it's a JSON string (from FormData)
      let parsedVariants = variants;
      if (typeof variants === 'string') {
        try {
          parsedVariants = JSON.parse(variants);
        } catch (e) {
          parsedVariants = [];
        }
      }

      // Convert variants to sizes array format
      if (Array.isArray(parsedVariants)) {
        updateData.sizes = parsedVariants.map((v: any) => ({
          size: v.size || 'M',
          isAvailable: true,
          price: v.price || basePrice || 0,
        }));
      }
    }

    // Handle file uploads - multer.array() puts files directly in req.files as an array
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;
    if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
      updateData.imageUrls = uploadedFiles.map((file) => `/uploads/pod/products/${file.filename}`);
      if (updateData.imageUrls[0]) {
        updateData.thumbnail = updateData.imageUrls[0];
      }
    }

    const updatedProduct = await PODProduct.findByIdAndUpdate(productId, updateData, { new: true });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product: {
          id: updatedProduct!._id.toString(),
          name: updatedProduct!.name,
          type: updatedProduct!.productType || null,
          basePrice: updatedProduct!.price,
          status: updatedProduct!.isActive ? 'active' : 'inactive',
          variants: updatedProduct!.sizes?.map((s: any) => ({
            size: s.size,
            price: s.price,
          })) || [],
          images: updatedProduct!.imageUrls?.map((img: string) => getFileUrl(req, img)) || [],
          updatedAt: updatedProduct!.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete POD Product (Admin)
 * DELETE /api/v1/admin/pod/products/:productId
 */
export const deletePODProduct = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await PODProduct.findByIdAndDelete(productId);

    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

