import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../utils/errors';
import { Favorite } from '../models/Favorite';
import { Store } from '../models/Store';
import { StoreProduct } from '../models/StoreProduct';
import mongoose from 'mongoose';

export const getUserFavorites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type } = req.query;

    const filter: any = { userId: req.user?.id };
    if (type && (type === 'stores' || type === 'products')) {
      filter.type = type === 'stores' ? 'store' : 'product';
    }

    const favorites = await Favorite.find(filter).sort({ addedAt: -1 });

    res.json({
      success: true,
      data: {
        favorites: favorites.map(fav => ({
          id: fav._id.toString(),
          type: fav.type,
          itemId: fav.itemId.toString(),
          addedAt: fav.addedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addToFavorites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, itemId } = req.body;

    if (!type || !itemId) {
      throw createError('Type and itemId are required', 400, 'VALIDATION_ERROR');
    }

    if (type !== 'store' && type !== 'product') {
      throw createError('Type must be "store" or "product"', 400, 'VALIDATION_ERROR');
    }

    // Check if already favorited
    const existing = await Favorite.findOne({
      userId: req.user?.id,
      type,
      itemId: new mongoose.Types.ObjectId(itemId),
    });

    if (existing) {
      throw createError('Item already in favorites', 409, 'DUPLICATE_ENTRY');
    }

    // Verify item exists
    let item;
    if (type === 'store') {
      item = await Store.findById(itemId);
    } else {
      item = await StoreProduct.findById(itemId);
    }
    
    if (!item) {
      throw createError(`${type} not found`, 404, 'NOT_FOUND');
    }
    
    const modelName = type === 'store' ? 'Store' : 'StoreProduct';

    const favorite = new Favorite({
      userId: req.user?.id,
      type,
      itemId: new mongoose.Types.ObjectId(itemId),
      typeModel: modelName,
    });

    await favorite.save();

    res.status(201).json({
      success: true,
      message: 'Added to favorites successfully',
      data: {
        id: favorite._id.toString(),
        type: favorite.type,
        itemId: favorite.itemId.toString(),
        addedAt: favorite.addedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromFavorites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { favoriteId } = req.params;

    const favorite = await Favorite.findOne({
      _id: favoriteId,
      userId: req.user?.id,
    });

    if (!favorite) {
      throw createError('Favorite not found', 404, 'NOT_FOUND');
    }

    await favorite.deleteOne();

    res.json({
      success: true,
      message: 'Removed from favorites successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const checkFavoriteStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, itemId } = req.query;

    if (!type || !itemId) {
      throw createError('Type and itemId are required', 400, 'VALIDATION_ERROR');
    }

    const favorite = await Favorite.findOne({
      userId: req.user?.id,
      type: type === 'stores' ? 'store' : 'product',
      itemId: new mongoose.Types.ObjectId(itemId as string),
    });

    res.json({
      success: true,
      data: {
        isFavorite: !!favorite,
      },
    });
  } catch (error) {
    next(error);
  }
};

