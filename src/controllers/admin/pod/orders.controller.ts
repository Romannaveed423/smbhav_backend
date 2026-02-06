import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../../middleware/admin';
import { PODOrder } from '../../../models/PODOrder';
import { User } from '../../../models/User';
import { createError } from '../../../utils/errors';
import mongoose from 'mongoose';

/**
 * List POD Orders (Admin)
 * GET /api/v1/admin/pod/orders
 */
export const listPODOrders = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, status, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.placedAt = {};
      if (startDate) {
        query.placedAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.placedAt.$lte = new Date(endDate as string);
      }
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search as string, $options: 'i' } },
        { orderNumber: { $regex: search as string, $options: 'i' } },
        { trackingNumber: { $regex: search as string, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      PODOrder.find(query)
        .populate('userId', 'name email phone')
        .sort({ placedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PODOrder.countDocuments(query),
    ]);

    const ordersData = orders.map((order: any) => {
      const user = order.userId;
      return {
        id: order._id.toString(),
        userId: order.userId?._id?.toString() || order.userId?.toString(),
        userName: user?.name || 'Unknown',
        products: order.items.map((item: any) => ({
          productId: item.productId?.toString() || item.productId,
          productName: item.productName,
          variant: {
            size: item.selectedSize,
            color: item.selectedColor,
            price: item.unitPrice,
          },
          customization: item.customization || {},
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        totalAmount: order.summary?.total || 0,
        status: order.status,
        orderDate: order.placedAt || order.createdAt,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber || null,
        shippedDate: order.status === 'shipped' || order.status === 'delivered' ? order.updatedAt : null,
        deliveredDate: order.status === 'delivered' ? order.deliveredAt : null,
      };
    });

    res.json({
      success: true,
      data: {
        orders: ordersData,
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
 * Get Single POD Order (Admin)
 * GET /api/v1/admin/pod/orders/:orderId
 */
export const getPODOrder = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await PODOrder.findById(orderId).populate('userId', 'name email phone').lean();

    if (!order) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    const user = order.userId as any;

    res.json({
      success: true,
      data: {
        order: {
          id: order._id.toString(),
          userId: user?._id?.toString() || order.userId?.toString(),
          userName: user?.name || 'Unknown',
          userEmail: user?.email || 'Unknown',
          products: order.items.map((item: any) => ({
            productId: item.productId?.toString() || item.productId,
            productName: item.productName,
            variant: {
              size: item.selectedSize,
              color: item.selectedColor,
              material: null, // PODProduct doesn't store material per variant
              price: item.unitPrice,
            },
            customization: item.customization || {},
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.totalPrice,
          })),
          totalAmount: order.summary?.subtotal || 0,
          shippingCost: order.summary?.deliveryCharges || 0,
          tax: 0, // Tax not stored separately in current model
          finalAmount: order.summary?.total || 0,
          status: order.status,
          orderDate: order.placedAt || order.createdAt,
          shippingAddress: order.shippingAddress,
          trackingNumber: order.trackingNumber || null,
          shippedDate: order.status === 'shipped' || order.status === 'delivered' ? order.updatedAt : null,
          deliveredDate: order.deliveredAt || null,
          cancelledDate: order.status === 'cancelled' ? order.updatedAt : null,
          cancellationReason: null, // Not stored in current model
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Order Status (Admin)
 * PUT /api/v1/admin/pod/orders/:orderId/status
 */
export const updatePODOrderStatus = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await PODOrder.findByIdAndUpdate(orderId, { status }, { new: true });

    if (!order) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    // Update deliveredAt if status is delivered
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
      await order.save();
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order: {
          id: order._id.toString(),
          status: order.status,
          updatedAt: order.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ship Order (Admin)
 * POST /api/v1/admin/pod/orders/:orderId/ship
 */
export const shipPODOrder = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { trackingNumber } = req.body;

    const order = await PODOrder.findByIdAndUpdate(
      orderId,
      {
        status: 'shipped',
        trackingNumber,
      },
      { new: true }
    );

    if (!order) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Order shipped successfully',
      data: {
        order: {
          id: order._id.toString(),
          status: order.status,
          trackingNumber: order.trackingNumber,
          shippedDate: order.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel Order (Admin)
 * POST /api/v1/admin/pod/orders/:orderId/cancel
 */
export const cancelPODOrder = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await PODOrder.findById(orderId);

    if (!order) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    if (order.status === 'delivered') {
      throw createError('Cannot cancel a delivered order', 400, 'INVALID_OPERATION');
    }

    order.status = 'cancelled';
    if (order.notes) {
      order.notes = `${order.notes}\nCancellation reason: ${reason}`;
    } else {
      order.notes = `Cancellation reason: ${reason}`;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order: {
          id: order._id.toString(),
          status: order.status,
          cancellationReason: reason,
          cancelledDate: order.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

