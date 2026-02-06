import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { PODCategory } from '../../models/PODCategory';
import { PODProduct } from '../../models/PODProduct';
import { PODBanner } from '../../models/PODBanner';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * Helper function to validate and convert string to MongoDB ObjectId
 * Returns null if the string is not a valid ObjectId
 */
function isValidObjectId(id: string | undefined | null): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  return trimmed.length === 24 && /^[0-9a-fA-F]{24}$/.test(trimmed);
}

function toObjectId(id: string | undefined | null): mongoose.Types.ObjectId | null {
  if (!isValidObjectId(id)) return null;
  return new mongoose.Types.ObjectId(id!.trim());
}

/**
 * Get product categories
 */
export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await PODCategory.find({
      parentCategoryId: { $exists: false },
      status: 1,
    })
      .sort({ order: 1 })
      .lean();

    res.json({
      success: true,
      data: categories.map((cat) => ({
        id: cat._id.toString(),
        cat_name: cat.cat_name,
        cat_img: cat.cat_img,
        status: cat.status,
        order: cat.order,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subcategories for a category
 */
export const getSubcategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;

    if (!isValidObjectId(categoryId)) {
      throw createError('Invalid category ID format', 400, 'VALIDATION_ERROR');
    }

    const subcategories = await PODCategory.find({
      parentCategoryId: new mongoose.Types.ObjectId(categoryId),
      status: 1,
    })
      .sort({ order: 1 })
      .lean();

    res.json({
      success: true,
      data: subcategories.map((sub) => ({
        id: sub._id.toString(),
        cat_name: sub.cat_name,
        cat_img: sub.cat_img,
        status: sub.status,
        parentCategoryId: sub.parentCategoryId?.toString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by category/subcategory with filters
 */
export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      categoryId,
      subcategoryId,
      search,
      sort = 'default',
      priceMin,
      priceMax,
      colors,
      sizes,
      materials,
      productTypes,
      expressDeliveryOnly,
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const query: any = {
      isActive: true,
    };

    const validSubcategoryId = toObjectId(subcategoryId as string);
    const validCategoryId = toObjectId(categoryId as string);
    
    if (validSubcategoryId) {
      query.subcategoryId = validSubcategoryId;
    } else if (validCategoryId) {
      query.categoryId = validCategoryId;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    if (priceMin || priceMax) {
      query.discountPrice = {};
      if (priceMin) query.discountPrice.$gte = Number(priceMin);
      if (priceMax) query.discountPrice.$lte = Number(priceMax);
    }

    if (expressDeliveryOnly === 'true') {
      query.isExpressDelivery = true;
    }

    // Build sort query
    let sortQuery: any = {};
    switch (sort) {
      case 'price_low_high':
        sortQuery = { discountPrice: 1 };
        break;
      case 'price_high_low':
        sortQuery = { discountPrice: -1 };
        break;
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'popular':
        sortQuery = { reviewCount: -1, averageRating: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      PODProduct.find(query)
        .populate('categoryId', 'cat_name')
        .populate('subcategoryId', 'cat_name')
        .sort(sortQuery)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PODProduct.countDocuments(query),
    ]);

    // Get available filters
    const allProducts = await PODProduct.find(query).lean();
    const availableColors = new Map<string, { name: string; code: string; count: number }>();
    const availableSizes = new Map<string, { size: string; count: number }>();
    const availableMaterials = new Map<string, { material: string; count: number }>();
    let minPrice = Infinity;
    let maxPrice = 0;

    allProducts.forEach((product) => {
      // Colors
      product.colors?.forEach((color) => {
        const key = color.colorCode;
        if (!availableColors.has(key)) {
          availableColors.set(key, { name: color.colorName, code: color.colorCode, count: 0 });
        }
        availableColors.get(key)!.count++;
      });

      // Sizes
      product.sizes?.forEach((size) => {
        if (!availableSizes.has(size.size)) {
          availableSizes.set(size.size, { size: size.size, count: 0 });
        }
        availableSizes.get(size.size)!.count++;
      });

      // Materials
      product.materials?.forEach((material) => {
        if (!availableMaterials.has(material)) {
          availableMaterials.set(material, { material, count: 0 });
        }
        availableMaterials.get(material)!.count++;
      });

      // Price range
      if (product.discountPrice < minPrice) minPrice = product.discountPrice;
      if (product.discountPrice > maxPrice) maxPrice = product.discountPrice;
    });

    res.json({
      success: true,
      data: {
        products: products.map((product) => ({
          id: product._id.toString(),
          productId: product.productId,
          name: product.name,
          categoryId: product.categoryId?._id?.toString() || product.categoryId?.toString(),
          subcategoryId: product.subcategoryId?._id?.toString() || product.subcategoryId?.toString(),
          categoryName: (product.categoryId as any)?.cat_name || null,
          subcategoryName: (product.subcategoryId as any)?.cat_name || null,
          imageUrls: product.imageUrls || [],
          thumbnail: product.thumbnail,
          price: product.price,
          discountPrice: product.discountPrice,
          description: product.description,
          shortDescription: product.shortDescription,
          colors: product.colors || [],
          sizes: product.sizes?.map((s: any) => {
            // Handle both object format {size: string} and string format
            return typeof s === 'object' && s.size ? s.size : (typeof s === 'string' ? s : String(s));
          }) || [],
          materials: product.materials || [],
          productType: product.productType,
          ratings: product.ratings || [],
          averageRating: product.averageRating,
          reviewCount: product.reviewCount,
          isExpressDelivery: product.isExpressDelivery,
          expressDeliveryDays: product.expressDeliveryDays,
          standardDeliveryDays: product.standardDeliveryDays,
          expressDeliveryPrice: product.expressDeliveryPrice,
          standardDeliveryPrice: product.standardDeliveryPrice,
          cashbackPercentage: product.cashbackPercentage,
          cashbackAmount: Math.round((product.discountPrice * product.cashbackPercentage) / 100),
          isActive: product.isActive,
          stock: product.stock,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        filters: {
          availableColors: Array.from(availableColors.values()),
          availableSizes: Array.from(availableSizes.values()),
          availableMaterials: Array.from(availableMaterials.values()),
          priceRange: {
            min: minPrice === Infinity ? 0 : minPrice,
            max: maxPrice,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product details
 */
export const getProductDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await PODProduct.findOne({
      $or: [
        { _id: new mongoose.Types.ObjectId(productId) },
        { productId: productId },
      ],
    })
      .populate('categoryId', 'cat_name')
      .populate('subcategoryId', 'cat_name')
      .lean();

    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    // Get reviews for average rating
    const reviews = await mongoose.model('PODReview').find({
      productId: product._id,
    }).lean();

    // Get related products (same category)
    const relatedProducts = await PODProduct.find({
      categoryId: product.categoryId,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(4)
      .select('productId name thumbnail price discountPrice')
      .lean();

    res.json({
      success: true,
      data: {
        id: product._id.toString(),
        productId: product.productId,
        name: product.name,
        categoryId: product.categoryId?._id?.toString() || product.categoryId?.toString(),
        subcategoryId: product.subcategoryId?._id?.toString() || product.subcategoryId?.toString(),
        categoryName: (product.categoryId as any)?.cat_name || 'N/A',
        subcategoryName: (product.subcategoryId as any)?.cat_name || 'N/A',
        imageUrls: product.imageUrls || [],
        thumbnail: product.thumbnail,
        price: product.price,
        discountPrice: product.discountPrice,
        description: product.description,
        shortDescription: product.shortDescription,
        colors: product.colors || [],
        sizes: product.sizes?.map((s: any) => {
          // Handle both object format {size: string} and string format
          return typeof s === 'object' && s.size ? s.size : (typeof s === 'string' ? s : String(s));
        }) || [],
        materials: product.materials || [],
        productType: product.productType,
        ratings: product.ratings || [],
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
        isExpressDelivery: product.isExpressDelivery,
        expressDeliveryDays: product.expressDeliveryDays,
        standardDeliveryDays: product.standardDeliveryDays,
        expressDeliveryPrice: product.expressDeliveryPrice,
        standardDeliveryPrice: product.standardDeliveryPrice,
        cashbackPercentage: product.cashbackPercentage,
        cashbackAmount: Math.round((product.discountPrice * product.cashbackPercentage) / 100),
        isActive: product.isActive,
        stock: product.stock,
        specifications: product.specifications || {},
        relatedProducts: relatedProducts.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          thumbnail: p.thumbnail,
          price: p.price,
          discountPrice: p.discountPrice,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search products
 */
export const searchProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, categoryId, page = 1, limit = 20 } = req.query;

    if (!q) {
      throw createError('Search query is required', 400, 'VALIDATION_ERROR');
    }

    const skip = (Number(page) - 1) * Number(limit);
    const query: any = {
      isActive: true,
      $text: { $search: q as string },
    };

    const validCategoryId = toObjectId(categoryId as string);
    if (validCategoryId) {
      query.categoryId = validCategoryId;
    }

    const [products, total] = await Promise.all([
      PODProduct.find(query)
        .populate('categoryId', 'cat_name')
        .select('productId name thumbnail price discountPrice categoryId')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PODProduct.countDocuments(query),
    ]);

    // Generate suggestions (simple implementation)
    const suggestions = [
      q,
      `${q} t-shirt`,
      `custom ${q}`,
    ];

    res.json({
      success: true,
      data: {
        products: products.map((product) => ({
          id: product._id.toString(),
          name: product.name,
          thumbnail: product.thumbnail,
          price: product.price,
          discountPrice: product.discountPrice,
          categoryName: (product.categoryId as any)?.cat_name || 'N/A',
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        suggestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get banners
 */
export const getBanners = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type = 'all' } = req.query;
    const now = new Date();

    const query: any = {
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: now } },
          ],
        },
      ],
    };

    if (type !== 'all') {
      query.type = type;
    }

    const banners = await PODBanner.find(query)
      .sort({ order: 1 })
      .lean();

    const carouselBanners = banners
      .filter((b) => b.type === 'carousel')
      .map((b) => ({
        id: b._id.toString(),
        banner: b.banner,
        title: b.title,
        link: b.link,
        order: b.order,
      }));

    const promotionalBanners = banners
      .filter((b) => b.type === 'promotional')
      .map((b) => ({
        id: b._id.toString(),
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        backgroundColor: b.backgroundColor,
        link: b.link,
      }));

    res.json({
      success: true,
      data: {
        carouselBanners,
        promotionalBanners,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get best sellers
 */
export const getBestSellers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = 8, categoryId } = req.query;

    // Debug logging
    console.log('[POD getBestSellers] Received query params:', { limit, categoryId, categoryIdType: typeof categoryId });

    const query: any = {
      isActive: true,
    };
    
    // Don't filter by reviewCount - MongoDB will handle sorting with null/missing values
    // Products with more reviews will naturally come first when sorted

    // Only add categoryId if it's a valid MongoDB ObjectId (24 character hex string)
    // Check for empty string, null, undefined, or "null" string
    if (categoryId && categoryId !== '' && categoryId !== 'null' && categoryId !== 'undefined') {
      const validCategoryId = toObjectId(categoryId as string);
      if (validCategoryId) {
        query.categoryId = validCategoryId;
        console.log('[POD getBestSellers] Added valid categoryId to query');
      } else {
        console.log('[POD getBestSellers] Invalid categoryId format, ignoring:', categoryId);
      }
    } else {
      console.log('[POD getBestSellers] No categoryId provided, fetching all best sellers');
    }

    // Wrap the query in try-catch to handle any MongoDB errors gracefully
    let products;
    try {
      // Sort by reviewCount descending (products with more reviews first)
      // MongoDB handles null/missing values by placing them last
      products = await PODProduct.find(query)
        .sort({ reviewCount: -1, averageRating: -1 })
        .limit(Number(limit))
        .select('productId name imageUrls thumbnail price discountPrice averageRating reviewCount isExpressDelivery cashbackPercentage')
        .lean();
    } catch (dbError: any) {
      console.error('[POD getBestSellers] Database query error:', dbError);
      // If query fails, try without categoryId filter or with simpler sort
      try {
        if (query.categoryId) {
          console.log('[POD getBestSellers] Retrying without categoryId filter...');
          delete query.categoryId;
        }
        // Try simpler sort without reviewCount
        products = await PODProduct.find(query)
          .sort({ averageRating: -1 })
          .limit(Number(limit))
          .select('productId name imageUrls thumbnail price discountPrice averageRating reviewCount isExpressDelivery cashbackPercentage')
          .lean();
      } catch (retryError: any) {
        console.error('[POD getBestSellers] Retry also failed:', retryError);
        throw retryError;
      }
    }

    res.json({
      success: true,
      data: {
        products: products.map((product) => ({
          id: product._id.toString(),
          productId: product.productId,
          name: product.name,
          imageUrls: product.imageUrls || [],
          thumbnail: product.thumbnail,
          price: product.price,
          discountPrice: product.discountPrice,
          averageRating: product.averageRating,
          reviewCount: product.reviewCount,
          isExpressDelivery: product.isExpressDelivery,
          cashbackPercentage: product.cashbackPercentage,
          cashbackAmount: Math.round((product.discountPrice * product.cashbackPercentage) / 100),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

