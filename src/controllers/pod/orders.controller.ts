import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { PODOrder } from '../../models/PODOrder';
import { PODCart } from '../../models/PODCart';
import { PODProduct } from '../../models/PODProduct';
import { PODCoupon } from '../../models/PODCoupon';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Place order
 */
export const placeOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      cartItemIds,
      shippingAddress,
      billingAddress,
      paymentMethod,
      deliveryType = 'standard',
      couponCode,
      notes,
    } = req.body;

    // Get cart items
    const cartQuery: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (cartItemIds && cartItemIds.length > 0) {
      cartQuery.cartItemId = { $in: cartItemIds };
    }

    const cartItems = await PODCart.find(cartQuery).populate('productId');

    if (cartItems.length === 0) {
      throw createError('Cart is empty', 400, 'EMPTY_CART');
    }

    // Validate stock and build order items
    const orderItems: any[] = [];
    let subtotal = 0;
    let totalDeliveryCharges = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.productId as any;

      // Check stock
      if (!product.stock.inStock || product.stock.quantity < cartItem.quantity) {
        throw createError(`Insufficient stock for ${product.name}`, 400, 'INSUFFICIENT_STOCK');
      }

      orderItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.thumbnail,
        quantity: cartItem.quantity,
        selectedColor: cartItem.selectedColor.colorName,
        selectedSize: cartItem.selectedSize,
        unitPrice: cartItem.unitPrice,
        totalPrice: cartItem.totalPrice,
        customization: cartItem.customization,
      });

      subtotal += cartItem.totalPrice;
      totalDeliveryCharges += cartItem.deliveryPrice;
    }

    // Apply coupon if provided
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode && couponCode.trim().length > 0) {
      const normalizedCouponCode = couponCode.trim().toUpperCase();
      
      appliedCoupon = await PODCoupon.findOne({
        couponCode: normalizedCouponCode,
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });

      if (appliedCoupon) {
        if (appliedCoupon.usageLimit && appliedCoupon.usageCount >= appliedCoupon.usageLimit) {
          throw createError('Coupon has reached usage limit', 400, 'COUPON_EXPIRED');
        }

        if (appliedCoupon.minPurchaseAmount && subtotal < appliedCoupon.minPurchaseAmount) {
          throw createError(`Minimum purchase amount of ₹${appliedCoupon.minPurchaseAmount} required`, 400, 'COUPON_INVALID');
        }

        if (appliedCoupon.discountType === 'percentage') {
          couponDiscount = (subtotal * appliedCoupon.discountValue) / 100;
          if (appliedCoupon.maxDiscountAmount) {
            couponDiscount = Math.min(couponDiscount, appliedCoupon.maxDiscountAmount);
          }
        } else {
          couponDiscount = appliedCoupon.discountValue;
        }
      } else {
        // Check if coupon exists but is inactive or expired
        const couponExists = await PODCoupon.findOne({ couponCode: normalizedCouponCode });
        if (couponExists) {
          if (!couponExists.isActive) {
            throw createError('This coupon is currently inactive', 400, 'COUPON_INACTIVE');
          }
          if (couponExists.validUntil < new Date()) {
            throw createError('This coupon has expired', 400, 'COUPON_EXPIRED');
          }
          if (couponExists.validFrom > new Date()) {
            throw createError('This coupon is not yet valid', 400, 'COUPON_NOT_VALID');
          }
        }
        throw createError(`Invalid coupon code: "${normalizedCouponCode}". Please check and try again.`, 400, 'INVALID_COUPON');
      }
    }

    // Calculate totals
    const discount = 0; // Product discounts already applied in unitPrice
    const total = subtotal + totalDeliveryCharges - discount - couponDiscount;

    // Calculate cashback (from first item's cashback percentage)
    const firstProduct = cartItems[0].productId as any;
    const cashbackPercentage = firstProduct.cashbackPercentage || 0;
    const cashback = Math.round((total * cashbackPercentage) / 100);

    // Calculate estimated delivery
    const deliveryDays = deliveryType === 'express' ? 2 : 5;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    // Create order
    const order = await PODOrder.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: orderItems,
      summary: {
        subtotal,
        deliveryCharges: totalDeliveryCharges,
        discount,
        couponDiscount,
        total,
        cashback,
      },
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      deliveryType,
      estimatedDelivery,
      couponCode: couponCode?.toUpperCase(),
      notes,
      status: 'pending',
      timeline: [
        {
          title: 'Order Placed',
          description: 'Your order has been placed',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(),
          completed: true,
          isCurrent: false,
        },
      ],
    });

    // Update coupon usage
    if (appliedCoupon) {
      appliedCoupon.usageCount += 1;
      await appliedCoupon.save();
    }

    // Update product stock
    for (const cartItem of cartItems) {
      const product = cartItem.productId as any;
      product.stock.quantity -= cartItem.quantity;
      if (product.stock.quantity <= 0) {
        product.stock.inStock = false;
      }
      await product.save();
    }

    // Clear cart items
    await PODCart.deleteMany({
      _id: { $in: cartItems.map((item) => item._id) },
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items,
        summary: order.summary,
        shippingAddress: order.shippingAddress,
        estimatedDelivery: order.estimatedDelivery,
        placedAt: order.placedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order details
 */
export const getOrderDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    const order = await PODOrder.findOne({
      $or: [
        { orderId },
        { orderNumber: orderId },
      ],
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate('items.productId', 'name thumbnail')
      .lean();

    if (!order) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    const statusMap: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Order Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned',
    };

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber || null,
        items: order.items.map((item: any) => ({
          productId: item.productId?._id?.toString() || item.productId?.toString(),
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          customization: item.customization,
        })),
        summary: order.summary,
        shippingAddress: order.shippingAddress,
        timeline: order.timeline || [],
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
        estimatedDeliveryDate: order.estimatedDelivery,
        placedAt: order.placedAt,
        deliveredAt: order.deliveredAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track order by order ID
 */
export const trackOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await PODOrder.findOne({
      $or: [
        { orderId },
        { orderNumber: orderId },
        { trackingNumber: orderId },
      ],
    }).lean();

    if (!order) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    const statusMap: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Order Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned',
    };

    const currentStatus = statusMap[order.status] || order.status;
    const currentTimeline = order.timeline?.find((t: any) => t.isCurrent) || order.timeline?.[order.timeline.length - 1];

    res.json({
      success: true,
      data: {
        orderId: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber || null,
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
        currentStatus,
        currentStatusDescription: currentTimeline?.description || 'Order is being processed',
        timeline: order.timeline || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user orders
 */
export const getUserOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.placedAt = {};
      if (startDate) query.placedAt.$gte = new Date(startDate as string);
      if (endDate) query.placedAt.$lte = new Date(endDate as string);
    }

    const [orders, total] = await Promise.all([
      PODOrder.find(query)
        .sort({ placedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PODOrder.countDocuments(query),
    ]);

    // Calculate summary
    const summary = await PODOrder.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryMap: Record<string, number> = {
      totalOrders: total,
      pending: 0,
      processing: 0,
      shipped: 0,
      inTransit: 0,
      delivered: 0,
      cancelled: 0,
    };

    summary.forEach((item) => {
      if (item._id === 'pending') summaryMap.pending = item.count;
      else if (item._id === 'processing') summaryMap.processing = item.count;
      else if (item._id === 'shipped') summaryMap.shipped = item.count;
      else if (item._id === 'in_transit') summaryMap.inTransit = item.count;
      else if (item._id === 'delivered') summaryMap.delivered = item.count;
      else if (item._id === 'cancelled') summaryMap.cancelled = item.count;
    });

    const statusMap: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Order Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned',
    };

    res.json({
      success: true,
      data: {
        orders: orders.map((order) => ({
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          orderId: order.orderNumber,
          product: order.items[0]?.productName || 'N/A',
          productCount: order.items.length,
          status: statusMap[order.status] || order.status,
          date: new Date(order.placedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          placedAt: order.placedAt,
          totalAmount: order.summary.total,
          trackingNumber: order.trackingNumber || null,
          estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
          deliveredAt: order.deliveredAt || null,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        summary: summaryMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const { reason, refundMethod = 'original' } = req.body;

    const order = await PODOrder.findOne({
      $or: [
        { orderId },
        { orderNumber: orderId },
      ],
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!order) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
      throw createError('Order cannot be cancelled at this stage', 400, 'CANCEL_NOT_ALLOWED');
    }

    order.status = 'cancelled';
    order.timeline.push({
      title: 'Order Cancelled',
      description: reason || 'Order cancelled by user',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: new Date(),
      completed: true,
      isCurrent: true,
    });

    await order.save();

    // Restore stock
    for (const item of order.items) {
      const product = await PODProduct.findById(item.productId);
      if (product) {
        product.stock.quantity += item.quantity;
        product.stock.inStock = true;
        await product.save();
      }
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order.orderNumber,
        status: order.status,
        refundAmount: order.summary.total,
        refundMethod,
        estimatedRefundTime: '5-7 business days',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return/Refund order
 */
export const returnOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const { reason, description, images, refundMethod = 'original' } = req.body;

    const order = await PODOrder.findOne({
      $or: [
        { orderId },
        { orderNumber: orderId },
      ],
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!order) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    if (order.status !== 'delivered') {
      throw createError('Only delivered orders can be returned', 400, 'RETURN_NOT_ALLOWED');
    }

    order.status = 'returned';
    order.timeline.push({
      title: 'Return Requested',
      description: description || 'Return request submitted',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: new Date(),
      completed: true,
      isCurrent: true,
    });

    await order.save();

    const returnId = `RET${Date.now()}`;

    res.json({
      success: true,
      message: 'Return request submitted successfully',
      data: {
        returnId,
        orderId: order.orderNumber,
        status: 'pending',
        requestedAt: new Date(),
        estimatedRefundTime: '7-10 business days after product received',
      },
    });
  } catch (error) {
    next(error);
  }
};

