import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { PODCart } from '../../models/PODCart';
import { PODProduct } from '../../models/PODProduct';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * Get express delivery information
 */
export const getExpressDeliveryInfo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        expressDelivery: {
          enabled: true,
          deliveryDays: 2,
          price: 99,
          description: 'Get your orders delivered in 2-3 days',
        },
        standardDelivery: {
          deliveryDays: 5,
          price: 0,
          description: 'Standard delivery in 5-7 days',
        },
        features: [
          {
            title: 'Fast Delivery',
            description: 'Get your orders in just 2-3 business days',
            icon: 'send',
          },
          {
            title: 'Priority Processing',
            description: 'Your orders are processed and shipped first',
            icon: 'star',
          },
          {
            title: 'Real-time Tracking',
            description: 'Track your express orders in real-time',
            icon: 'location',
          },
          {
            title: 'Secure Packaging',
            description: 'Premium packaging to protect your items',
            icon: 'shield_done',
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check express delivery availability
 */
export const checkExpressDelivery = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await PODProduct.findOne({
      $or: [
        { _id: new mongoose.Types.ObjectId(productId) },
        { productId: productId },
      ],
    });

    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    const now = new Date();
    const currentHour = now.getHours();
    const cutoffTime = '14:00';
    const cutoffHour = 14;

    const isAvailable = product.isExpressDelivery && currentHour < cutoffHour;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + product.expressDeliveryDays);

    res.json({
      success: true,
      data: {
        isAvailable,
        deliveryDays: product.expressDeliveryDays,
        price: product.expressDeliveryPrice,
        estimatedDelivery,
        cutoffTime,
        message: isAvailable ? 'Order before 2 PM for express delivery' : 'Express delivery not available for this product or time',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get delivery charges
 */
export const getDeliveryCharges = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pincode, cartItemIds, deliveryType = 'standard' } = req.query;
    const userId = req.user?.id;

    if (!pincode) {
      throw createError('Pincode is required', 400, 'VALIDATION_ERROR');
    }

    // Get cart items if provided
    let cartItems: any[] = [];
    if (cartItemIds && Array.isArray(cartItemIds) && cartItemIds.length > 0) {
      cartItems = await PODCart.find({
        cartItemId: { $in: cartItemIds },
        userId: new mongoose.Types.ObjectId(userId),
      }).populate('productId');
    } else {
      cartItems = await PODCart.find({
        userId: new mongoose.Types.ObjectId(userId),
      }).populate('productId');
    }

    // Calculate delivery charges based on items
    let expressPrice = 99;
    let standardPrice = 0;

    // In production, calculate based on weight, distance, etc.
    if (cartItems.length > 0) {
      const hasExpress = cartItems.some((item) => (item.productId as any).isExpressDelivery);
      if (!hasExpress) {
        expressPrice = 0; // Not available
      }
    }

    const now = new Date();
    const standardDelivery = new Date(now);
    standardDelivery.setDate(standardDelivery.getDate() + 5);

    const expressDelivery = new Date(now);
    expressDelivery.setDate(expressDelivery.getDate() + 2);

    res.json({
      success: true,
      data: {
        pincode,
        city: 'Mumbai', // In production, get from pincode API
        state: 'Maharashtra',
        deliveryOptions: [
          {
            type: 'standard',
            price: standardPrice,
            deliveryDays: 5,
            estimatedDelivery: standardDelivery,
            description: 'Free delivery in 5-7 days',
          },
          {
            type: 'express',
            price: expressPrice,
            deliveryDays: 2,
            estimatedDelivery: expressDelivery,
            description: expressPrice > 0 ? 'Express delivery in 2-3 days' : 'Express delivery not available',
          },
        ],
        isServiceable: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get address suggestions
 */
export const getAddressSuggestions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pincode } = req.query;

    if (!pincode) {
      throw createError('Pincode is required', 400, 'VALIDATION_ERROR');
    }

    // In production, integrate with pincode API (India Post, etc.)
    const suggestions = [
      {
        city: 'Mumbai',
        state: 'Maharashtra',
        district: 'Mumbai',
        postOffice: 'Fort',
        isServiceable: true,
      },
    ];

    res.json({
      success: true,
      data: {
        pincode,
        suggestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

