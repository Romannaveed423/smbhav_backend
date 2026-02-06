import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../utils/errors';
import { Location } from '../models/Location';
import { Store } from '../models/Store';
import { StoreProduct } from '../models/StoreProduct';
import { StoreCategory } from '../models/StoreCategory';
import { Banner } from '../models/Banner';
import { Favorite } from '../models/Favorite';
import { StoreReview } from '../models/StoreReview';
import mongoose from 'mongoose';

// ==================== Location APIs ====================

export const getUserLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const location = await Location.findOne({ userId: req.user?.id, isDefault: true });
    
    if (!location) {
      throw createError('No default location found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: location._id.toString(),
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        isDefault: location.isDefault,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserLocations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locations = await Location.find({ userId: req.user?.id }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        locations: locations.map(loc => ({
          id: loc._id.toString(),
          address: loc.address,
          latitude: loc.latitude,
          longitude: loc.longitude,
          isDefault: loc.isDefault,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { locationId } = req.body;

    if (!locationId) {
      throw createError('Location ID is required', 400, 'VALIDATION_ERROR');
    }

    const location = await Location.findOne({ _id: locationId, userId: req.user?.id });
    if (!location) {
      throw createError('Location not found', 404, 'NOT_FOUND');
    }

    // Set this location as default
    location.isDefault = true;
    await location.save();

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        id: location._id.toString(),
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        isDefault: location.isDefault,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchLocations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      throw createError('Search query is required', 400, 'VALIDATION_ERROR');
    }

    // This is a simplified search - in production, you'd use a geocoding service
    // For now, we'll search in existing user locations
    const locations = await Location.find({
      userId: req.user?.id,
      address: { $regex: query, $options: 'i' },
    }).limit(10);

    res.json({
      success: true,
      data: {
        locations: locations.map(loc => ({
          id: loc._id.toString(),
          address: loc.address,
          latitude: loc.latitude,
          longitude: loc.longitude,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Search APIs ====================

export const searchItems = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query, category, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { isActive: true };

    if (query && typeof query === 'string') {
      filter.$text = { $search: query };
    }

    if (category && typeof category === 'string') {
      const categoryDoc = await StoreCategory.findOne({ name: category });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      }
    }

    const [items, total] = await Promise.all([
      StoreProduct.find(filter)
        .populate('storeId', 'name')
        .populate('category', 'name')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StoreProduct.countDocuments(filter),
    ]);

    // Get favorite status for each item
    const productIds = items.map(item => item._id);
    const favorites = await Favorite.find({
      userId: req.user?.id,
      type: 'product',
      itemId: { $in: productIds },
    });
    const favoriteMap = new Map(favorites.map(fav => [fav.itemId.toString(), true]));

    res.json({
      success: true,
      data: {
        items: items.map(item => ({
          id: item._id.toString(),
          name: item.name,
          description: item.description,
          price: item.price,
          originalPrice: item.originalPrice,
          discountPercent: item.discountPercent,
          image: item.image,
          category: (item.category as any)?.name || '',
          rating: item.rating,
          reviews: item.reviews,
          stock: item.stock,
          storeId: item.storeId ? (item.storeId as any)._id.toString() : '',
          storeName: item.storeId ? (item.storeId as any).name : '',
          isFavorite: favoriteMap.has(item._id.toString()),
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const voiceSearch = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { audioFile } = req.body;

    if (!audioFile) {
      throw createError('Audio file is required', 400, 'VALIDATION_ERROR');
    }

    // In production, you would:
    // 1. Decode base64 audio
    // 2. Send to speech-to-text service (Google Cloud Speech, AWS Transcribe, etc.)
    // 3. Process the text query
    // For now, we'll return a mock response

    res.json({
      success: true,
      data: {
        query: 'sample query from voice',
        items: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Banner APIs ====================

export const getBanners = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { locationId } = req.query;

    const filter: any = { isActive: true };
    if (locationId) {
      filter.$or = [
        { locationId: new mongoose.Types.ObjectId(locationId as string) },
        { locationId: { $exists: false } }, // Global banners
      ];
    } else {
      filter.locationId = { $exists: false }; // Only global banners if no location
    }

    const banners = await Banner.find(filter).sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        banners: banners.map(banner => ({
          id: banner._id.toString(),
          title: banner.title,
          description: banner.description,
          image: banner.image,
          link: banner.link,
          linkType: banner.linkType,
          order: banner.order,
          isActive: banner.isActive,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Category APIs ====================

export const getCategories = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await StoreCategory.find({ isActive: true }).sort({ order: 1, name: 1 });

    res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          id: cat._id.toString(),
          name: cat.name,
          icon: cat.icon,
          image: cat.image,
          backgroundColor: cat.backgroundColor,
          productCount: cat.productCount,
          order: cat.order,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { page = '1', limit = '20', sort = 'newest' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { category: categoryId, isActive: true };

    let sortOption: any = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };

    const [items, total] = await Promise.all([
      StoreProduct.find(filter)
        .populate('storeId', 'name')
        .skip(skip)
        .limit(limitNum)
        .sort(sortOption)
        .lean(),
      StoreProduct.countDocuments(filter),
    ]);

    const productIds = items.map(item => item._id);
    const favorites = await Favorite.find({
      userId: req.user?.id,
      type: 'product',
      itemId: { $in: productIds },
    });
    const favoriteMap = new Map(favorites.map(fav => [fav.itemId.toString(), true]));

    res.json({
      success: true,
      data: {
        items: items.map(item => ({
          id: item._id.toString(),
          name: item.name,
          description: item.description,
          price: item.price,
          originalPrice: item.originalPrice,
          discountPercent: item.discountPercent,
          image: item.image,
          category: '',
          rating: item.rating,
          reviews: item.reviews,
          stock: item.stock,
          storeId: item.storeId ? (item.storeId as any)._id.toString() : '',
          storeName: item.storeId ? (item.storeId as any).name : '',
          isFavorite: favoriteMap.has(item._id.toString()),
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Store APIs ====================

export const getRecommendedStores = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { locationId, limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Get user's location if provided (for future use in distance calculation)
    if (locationId) {
      await Location.findById(locationId);
    } else {
      await Location.findOne({ userId: req.user?.id, isDefault: true });
    }

    const stores = await Store.find({ isActive: true, status: 'open' })
      .sort({ rating: -1, reviews: -1 })
      .limit(limitNum)
      .lean();

    // Get favorite status
    const storeIds = stores.map(store => store._id);
    const favorites = await Favorite.find({
      userId: req.user?.id,
      type: 'store',
      itemId: { $in: storeIds },
    });
    const favoriteMap = new Map(favorites.map(fav => [fav.itemId.toString(), true]));

    res.json({
      success: true,
      data: {
        stores: stores.map(store => ({
          id: store._id.toString(),
          name: store.name,
          description: store.description,
          status: store.status,
          backgroundColor: store.backgroundColor,
          icon: store.icon,
          iconColor: store.iconColor,
          leftImage: store.leftImage,
          rating: store.rating,
          reviews: store.reviews,
          location: store.location.address,
          deliveryTime: store.deliveryTime,
          deliveryFee: store.deliveryFee,
          minOrder: store.minOrder,
          isFavorite: favoriteMap.has(store._id.toString()),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRecommendedStores = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { locationId: _locationId, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const stores = await Store.find({ isActive: true })
      .sort({ rating: -1, reviews: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Store.countDocuments({ isActive: true });

    const storeIds = stores.map(store => store._id);
    const favorites = await Favorite.find({
      userId: req.user?.id,
      type: 'store',
      itemId: { $in: storeIds },
    });
    const favoriteMap = new Map(favorites.map(fav => [fav.itemId.toString(), true]));

    res.json({
      success: true,
      data: {
        stores: stores.map(store => ({
          id: store._id.toString(),
          name: store.name,
          description: store.description,
          status: store.status,
          backgroundColor: store.backgroundColor,
          icon: store.icon,
          iconColor: store.iconColor,
          leftImage: store.leftImage,
          rating: store.rating,
          reviews: store.reviews,
          location: store.location.address,
          deliveryTime: store.deliveryTime,
          deliveryFee: store.deliveryFee,
          minOrder: store.minOrder,
          isFavorite: favoriteMap.has(store._id.toString()),
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404, 'NOT_FOUND');
    }

    const favorite = await Favorite.findOne({
      userId: req.user?.id,
      type: 'store',
      itemId: store._id,
    });

    res.json({
      success: true,
      data: {
        id: store._id.toString(),
        name: store.name,
        description: store.description,
        status: store.status,
        rating: store.rating,
        reviews: store.reviews,
        location: store.location,
        deliveryTime: store.deliveryTime,
        deliveryFee: store.deliveryFee,
        minOrder: store.minOrder,
        images: store.images,
        categories: store.categories,
        isFavorite: !!favorite,
        openingHours: store.openingHours,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchStores = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query, locationId: _locationId } = req.query;

    const filter: any = { isActive: true };
    if (query && typeof query === 'string') {
      filter.$text = { $search: query };
    }

    const stores = await Store.find(filter)
      .sort({ rating: -1 })
      .limit(20)
      .lean();

    const storeIds = stores.map(store => store._id);
    const favorites = await Favorite.find({
      userId: req.user?.id,
      type: 'store',
      itemId: { $in: storeIds },
    });
    const favoriteMap = new Map(favorites.map(fav => [fav.itemId.toString(), true]));

    res.json({
      success: true,
      data: {
        stores: stores.map(store => ({
          id: store._id.toString(),
          name: store.name,
          description: store.description,
          status: store.status,
          backgroundColor: store.backgroundColor,
          icon: store.icon,
          iconColor: store.iconColor,
          leftImage: store.leftImage,
          rating: store.rating,
          reviews: store.reviews,
          location: store.location.address,
          deliveryTime: store.deliveryTime,
          deliveryFee: store.deliveryFee,
          minOrder: store.minOrder,
          isFavorite: favoriteMap.has(store._id.toString()),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Product APIs ====================

export const getSpecialOffers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      StoreProduct.find({ isActive: true, isSpecialOffer: true })
        .populate('storeId', 'name')
        .skip(skip)
        .limit(limitNum)
        .sort({ discountPercent: -1 })
        .lean(),
      StoreProduct.countDocuments({ isActive: true, isSpecialOffer: true }),
    ]);

    const productIds = products.map(p => p._id);
    const favorites = await Favorite.find({
      userId: req.user?.id,
      type: 'product',
      itemId: { $in: productIds },
    });
    const favoriteMap = new Map(favorites.map(fav => [fav.itemId.toString(), true]));

    res.json({
      success: true,
      data: {
        products: products.map(product => ({
          id: product._id.toString(),
          name: product.name,
          image: product.image,
          discountPercent: product.discountPercent,
          originalPrice: product.originalPrice,
          discountedPrice: product.price,
          rating: product.rating,
          reviews: product.reviews,
          quantityType: product.quantityType,
          stock: product.stock,
          storeId: product.storeId ? (product.storeId as any)._id.toString() : '',
          storeName: product.storeId ? (product.storeId as any).name : '',
          isFavorite: favoriteMap.has(product._id.toString()),
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHighlights = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      StoreProduct.find({ isActive: true, isHighlight: true })
        .populate('storeId', 'name')
        .skip(skip)
        .limit(limitNum)
        .sort({ rating: -1, reviews: -1 })
        .lean(),
      StoreProduct.countDocuments({ isActive: true, isHighlight: true }),
    ]);

    const productIds = products.map(p => p._id);
    const favorites = await Favorite.find({
      userId: req.user?.id,
      type: 'product',
      itemId: { $in: productIds },
    });
    const favoriteMap = new Map(favorites.map(fav => [fav.itemId.toString(), true]));

    res.json({
      success: true,
      data: {
        products: products.map(product => ({
          id: product._id.toString(),
          name: product.name,
          image: product.image,
          discountPercent: product.discountPercent,
          originalPrice: product.originalPrice,
          discountedPrice: product.price,
          rating: product.rating,
          reviews: product.reviews,
          quantityType: product.quantityType,
          stock: product.stock,
          storeId: product.storeId ? (product.storeId as any)._id.toString() : '',
          storeName: product.storeId ? (product.storeId as any).name : '',
          isFavorite: favoriteMap.has(product._id.toString()),
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await StoreProduct.findById(productId)
      .populate('storeId', 'name')
      .populate('category', 'name');

    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    const favorite = await Favorite.findOne({
      userId: req.user?.id,
      type: 'product',
      itemId: product._id,
    });

    // Get reviews
    const reviews = await StoreReview.find({ productId: product._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        images: product.images.length > 0 ? product.images : [product.image],
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        rating: product.rating,
        reviews: reviews.map(review => ({
          id: review._id.toString(),
          userId: (review.userId as any)?._id?.toString() || '',
          userName: (review.userId as any)?.name || 'Anonymous',
          rating: review.rating,
          comment: review.comment,
          date: review.createdAt,
        })),
        quantityType: product.quantityType,
        stock: product.stock,
        category: (product.category as any)?.name || '',
        storeId: product.storeId ? (product.storeId as any)._id.toString() : '',
        storeName: product.storeId ? (product.storeId as any).name : '',
        isFavorite: !!favorite,
        specifications: product.specifications || {},
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { storeId } = req.params;
    const { page = '1', limit = '20', category } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { storeId, isActive: true };
    if (category) {
      const categoryDoc = await StoreCategory.findOne({ name: category });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      }
    }

    const [items, total] = await Promise.all([
      StoreProduct.find(filter)
        .populate('storeId', 'name')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StoreProduct.countDocuments(filter),
    ]);

    const productIds = items.map(item => item._id);
    const favorites = await Favorite.find({
      userId: req.user?.id,
      type: 'product',
      itemId: { $in: productIds },
    });
    const favoriteMap = new Map(favorites.map(fav => [fav.itemId.toString(), true]));

    res.json({
      success: true,
      data: {
        items: items.map(item => ({
          id: item._id.toString(),
          name: item.name,
          description: item.description,
          price: item.price,
          originalPrice: item.originalPrice,
          discountPercent: item.discountPercent,
          image: item.image,
          category: '',
          rating: item.rating,
          reviews: item.reviews,
          stock: item.stock,
          storeId: item.storeId ? (item.storeId as any)._id.toString() : '',
          storeName: item.storeId ? (item.storeId as any).name : '',
          isFavorite: favoriteMap.has(item._id.toString()),
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Utility APIs ====================

export const getDeliveryTimeEstimate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      throw createError('Store ID is required', 400, 'VALIDATION_ERROR');
    }

    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404, 'NOT_FOUND');
    }

    // In production, calculate based on distance between store and user location
    // For now, return store's default delivery time
    res.json({
      success: true,
      data: {
        estimatedTime: store.deliveryTime,
        deliveryFee: store.deliveryFee,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404, 'NOT_FOUND');
    }

    // Calculate if store is open based on opening hours
    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const todayHours = store.openingHours[dayOfWeek as keyof typeof store.openingHours];

    let status = 'closed';
    let nextOpenTime = '';

    if (todayHours && todayHours.open && todayHours.close) {
      const [openHour, openMin] = todayHours.open.split(':').map(Number);
      const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
      const nowHour = now.getHours();
      const nowMin = now.getMinutes();

      const openTime = openHour * 60 + openMin;
      const closeTime = closeHour * 60 + closeMin;
      const currentTime = nowHour * 60 + nowMin;

      if (currentTime >= openTime && currentTime < closeTime) {
        status = 'open';
      } else {
        status = 'closed';
        nextOpenTime = todayHours.open;
      }
    } else {
      status = store.status;
    }

    res.json({
      success: true,
      data: {
        status,
        nextOpenTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

