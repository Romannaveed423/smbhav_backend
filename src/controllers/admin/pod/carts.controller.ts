import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../../middleware/admin';
import { PODCart } from '../../../models/PODCart';
import { createError } from '../../../utils/errors';
import mongoose from 'mongoose';

/**
 * List all carts (Admin)
 * GET /api/v1/admin/pod/carts
 */
export const listPODCarts = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, userId, productId, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId as string)) {
        throw createError('Invalid user ID format', 400, 'VALIDATION_ERROR');
      }
      query.userId = new mongoose.Types.ObjectId(userId as string);
    }

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId as string)) {
        throw createError('Invalid product ID format', 400, 'VALIDATION_ERROR');
      }
      query.productId = new mongoose.Types.ObjectId(productId as string);
    }

    const [carts, total] = await Promise.all([
      PODCart.find(query)
        .populate('userId', 'name email phone')
        .populate('productId', 'name thumbnail discountPrice')
        .sort({ addedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PODCart.countDocuments(query),
    ]);

    const cartsData = carts.map((cart: any) => {
      const user = cart.userId;
      const product = cart.productId;
      return {
        id: cart._id.toString(),
        cartItemId: cart.cartItemId,
        userId: user?._id?.toString() || cart.userId?.toString() || '',
        userName: user?.name || 'N/A',
        userEmail: user?.email || 'N/A',
        productId: product?._id?.toString() || cart.productId?.toString() || '',
        productName: product?.name || 'N/A',
        productImage: product?.thumbnail || product?.imageUrls?.[0] || '',
        quantity: cart.quantity || 0,
        selectedColor: cart.selectedColor || null,
        selectedSize: cart.selectedSize || null,
        unitPrice: cart.unitPrice || 0,
        totalPrice: cart.totalPrice || 0,
        deliveryType: cart.deliveryType || 'standard',
        deliveryPrice: cart.deliveryPrice || 0,
        estimatedDelivery: cart.estimatedDelivery || null,
        addedAt: cart.addedAt || cart.createdAt || new Date(),
        updatedAt: cart.updatedAt || cart.createdAt || new Date(),
      };
    });

    res.json({
      success: true,
      data: {
        carts: cartsData,
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
 * Get cart by ID (Admin)
 * GET /api/v1/admin/pod/carts/:cartId
 */
export const getPODCart = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cartId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      throw createError('Invalid cart ID format', 400, 'VALIDATION_ERROR');
    }

    const cart = await PODCart.findById(cartId)
      .populate('userId', 'name email phone')
      .populate('productId')
      .lean();

    if (!cart) {
      throw createError('Cart not found', 404, 'NOT_FOUND');
    }

    const user = cart.userId as any;
    const product = cart.productId as any;

    res.json({
      success: true,
      data: {
        cart: {
          id: cart._id.toString(),
          cartItemId: cart.cartItemId,
          userId: user?._id?.toString() || cart.userId?.toString(),
          userName: user?.name || 'N/A',
          userEmail: user?.email || 'N/A',
          productId: product?._id?.toString() || cart.productId?.toString(),
          productName: product?.name || 'N/A',
          productImage: product?.thumbnail || '',
          quantity: cart.quantity,
          selectedColor: cart.selectedColor || null,
          selectedSize: cart.selectedSize || null,
          customization: cart.customization || null,
          unitPrice: cart.unitPrice,
          totalPrice: cart.totalPrice,
          deliveryType: cart.deliveryType,
          deliveryPrice: cart.deliveryPrice,
          estimatedDelivery: cart.estimatedDelivery,
          notes: cart.notes || null,
          addedAt: cart.addedAt,
          updatedAt: cart.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete cart item (Admin)
 * DELETE /api/v1/admin/pod/carts/:cartId
 */
export const deletePODCart = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cartId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      throw createError('Invalid cart ID format', 400, 'VALIDATION_ERROR');
    }

    const cart = await PODCart.findByIdAndDelete(cartId);

    if (!cart) {
      throw createError('Cart not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Cart item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cart statistics (Admin)
 * GET /api/v1/admin/pod/carts/stats
 */
export const getPODCartStats = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalCarts, totalItems, totalValue, uniqueUsers] = await Promise.all([
      PODCart.countDocuments(),
      PODCart.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$quantity' },
          },
        },
      ]),
      PODCart.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' },
          },
        },
      ]),
      PODCart.distinct('userId'),
    ]);

    res.json({
      success: true,
      data: {
        totalCarts,
        totalItems: totalItems[0]?.total || 0,
        totalValue: totalValue[0]?.total || 0,
        uniqueUsers: uniqueUsers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

