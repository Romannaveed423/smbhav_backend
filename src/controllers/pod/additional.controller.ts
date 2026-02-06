import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { PODCoupon } from '../../models/PODCoupon';
import { PODCart } from '../../models/PODCart';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * Apply coupon code
 */
export const applyCoupon = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { couponCode, cartTotal, cartItems } = req.body;

    if (!couponCode) {
      throw createError('Coupon code is required', 400, 'VALIDATION_ERROR');
    }

    const coupon = await PODCoupon.findOne({
      couponCode: couponCode.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!coupon) {
      throw createError('Invalid or expired coupon code', 400, 'INVALID_COUPON');
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw createError('Coupon has reached usage limit', 400, 'COUPON_EXPIRED');
    }

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount && cartTotal < coupon.minPurchaseAmount) {
      throw createError(`Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`, 400, 'COUPON_INVALID');
    }

    // Check user usage limit
    if (coupon.userUsageLimit) {
      // In production, check user's previous usage
      // For now, we'll skip this check
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    res.json({
      success: true,
      data: {
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        minPurchaseAmount: coupon.minPurchaseAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        validUntil: coupon.validUntil,
        description: coupon.description || `Get ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : '₹'} off`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get packaging material categories
 */
export const getPackagingCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // In production, fetch from database
    const categories = [
      {
        id: '1',
        name: 'Boxes',
        icon: 'category',
        color: '#0175C2',
        image: 'https://example.com/images/boxes.jpg',
      },
      {
        id: '2',
        name: 'Bubble Wrap',
        icon: 'image',
        color: '#1E88E5',
        image: 'https://example.com/images/bubble-wrap.jpg',
      },
      {
        id: '3',
        name: 'Tape',
        icon: 'document',
        color: '#FF9800',
        image: 'https://example.com/images/tape.jpg',
      },
      {
        id: '4',
        name: 'Labels',
        icon: 'ticket',
        color: '#4CAF50',
        image: 'https://example.com/images/labels.jpg',
      },
      {
        id: '5',
        name: 'Envelopes',
        icon: 'document',
        color: '#9C27B0',
        image: 'https://example.com/images/envelopes.jpg',
      },
      {
        id: '6',
        name: 'Protective',
        icon: 'shield_done',
        color: '#F44336',
        image: 'https://example.com/images/protective.jpg',
      },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get packaging products
 */
export const getPackagingProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // In production, fetch from database
    const products = [
      {
        id: 'PKG101',
        name: 'Cardboard Box - Small',
        categoryId: '1',
        categoryName: 'Boxes',
        image: 'https://example.com/images/box-small.jpg',
        price: 50,
        dimensions: '10x10x10 cm',
        weight: '200g',
        description: 'Sturdy cardboard box for small items',
      },
    ];

    res.json({
      success: true,
      data: {
        products: products.slice(skip, skip + Number(limit)),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: products.length,
          totalPages: Math.ceil(products.length / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

