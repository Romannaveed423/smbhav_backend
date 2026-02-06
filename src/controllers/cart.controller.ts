import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../utils/errors';
import { StoreCart } from '../models/StoreCart';
import { StoreProduct } from '../models/StoreProduct';
import { Store } from '../models/Store';
import mongoose from 'mongoose';

export const getCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cartItems = await StoreCart.find({ userId: req.user?.id })
      .populate('productId')
      .populate('storeId', 'name')
      .lean();

    let subtotal = 0;
    let deliveryFee = 0;
    let storeId: string | null = null;

    const items = cartItems.map(item => {
      const product = item.productId as any;
      const store = item.storeId as any;
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      if (!storeId && store) {
        storeId = store._id.toString();
      }

      return {
        id: item._id.toString(),
        productId: product._id.toString(),
        productName: product.name,
        productImage: product.image,
        price: product.price,
        quantity: item.quantity,
        storeId: store ? store._id.toString() : '',
        storeName: store ? store.name : '',
      };
    });

    // Get delivery fee from store if items exist
    if (storeId) {
      const store = await Store.findById(storeId);
      if (store) {
        deliveryFee = store.deliveryFee;
      }
    }

    const total = subtotal + deliveryFee;

    res.json({
      success: true,
      data: {
        items,
        subtotal,
        deliveryFee,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, quantity, storeId } = req.body;

    if (!productId || !quantity || !storeId) {
      throw createError('Product ID, quantity, and store ID are required', 400, 'VALIDATION_ERROR');
    }

    if (quantity < 1) {
      throw createError('Quantity must be at least 1', 400, 'VALIDATION_ERROR');
    }

    // Verify product exists
    const product = await StoreProduct.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    if (!product.isActive) {
      throw createError('Product is not available', 400, 'INVALID_STATE');
    }

    if (product.stock < quantity) {
      throw createError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404, 'NOT_FOUND');
    }

    // Check if item already in cart
    const existingCartItem = await StoreCart.findOne({
      userId: req.user?.id,
      productId,
    });

    if (existingCartItem) {
      // Update quantity
      existingCartItem.quantity += quantity;
      if (product.stock < existingCartItem.quantity) {
        throw createError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
      }
      await existingCartItem.save();

      res.json({
        success: true,
        message: 'Cart updated successfully',
        data: {
          id: existingCartItem._id.toString(),
          productId: existingCartItem.productId.toString(),
          quantity: existingCartItem.quantity,
        },
      });
    } else {
      // Create new cart item
      const cartItem = new StoreCart({
        userId: req.user?.id,
        productId: new mongoose.Types.ObjectId(productId),
        quantity,
        storeId: new mongoose.Types.ObjectId(storeId),
      });

      await cartItem.save();

      res.status(201).json({
        success: true,
        message: 'Added to cart successfully',
        data: {
          id: cartItem._id.toString(),
          productId: cartItem.productId.toString(),
          quantity: cartItem.quantity,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      throw createError('Quantity must be at least 1', 400, 'VALIDATION_ERROR');
    }

    const cartItem = await StoreCart.findOne({
      _id: itemId,
      userId: req.user?.id,
    }).populate('productId');

    if (!cartItem) {
      throw createError('Cart item not found', 404, 'NOT_FOUND');
    }

    const product = cartItem.productId as any;
    if (product.stock < quantity) {
      throw createError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        id: cartItem._id.toString(),
        quantity: cartItem.quantity,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;

    const cartItem = await StoreCart.findOne({
      _id: itemId,
      userId: req.user?.id,
    });

    if (!cartItem) {
      throw createError('Cart item not found', 404, 'NOT_FOUND');
    }

    await cartItem.deleteOne();

    res.json({
      success: true,
      message: 'Removed from cart successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await StoreCart.deleteMany({ userId: req.user?.id });

    res.json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

