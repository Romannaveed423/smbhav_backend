import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { PODReview } from '../../models/PODReview';
import { PODProduct } from '../../models/PODProduct';
import { PODOrder } from '../../models/PODOrder';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * Get product reviews
 */
export const getProductReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const product = await PODProduct.findOne({
      $or: [
        { _id: new mongoose.Types.ObjectId(productId) },
        { productId: productId },
      ],
    });

    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    let sortQuery: any = {};
    switch (sort) {
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'highest_rating':
        sortQuery = { rating: -1 };
        break;
      case 'lowest_rating':
        sortQuery = { rating: 1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const [reviews, total] = await Promise.all([
      PODReview.find({ productId: product._id })
        .populate('userId', 'name profileImage')
        .sort(sortQuery)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PODReview.countDocuments({ productId: product._id }),
    ]);

    // Calculate rating distribution
    const ratingDistribution = await PODReview.aggregate([
      {
        $match: { productId: product._id },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    ratingDistribution.forEach((item) => {
      distribution[item._id.toString()] = item.count;
    });

    res.json({
      success: true,
      data: {
        reviews: reviews.map((review) => ({
          id: review._id.toString(),
          userId: (review.userId as any)?._id?.toString() || review.userId?.toString(),
          userName: (review.userId as any)?.name || 'Anonymous',
          userImage: (review.userId as any)?.profileImage || null,
          rating: review.rating,
          comment: review.comment,
          images: review.images || [],
          verifiedPurchase: review.verifiedPurchase,
          date: review.createdAt,
          helpful: review.helpful,
        })),
        summary: {
          averageRating: product.averageRating,
          totalReviews: total,
          ratingDistribution: distribution,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add product review
 */
export const addReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;
    const { orderId, rating, comment, images, pros, cons } = req.body;

    // Verify order belongs to user and is delivered
    const order = await PODOrder.findOne({
      $or: [
        { orderId: orderId },
        { orderNumber: orderId },
      ],
      userId: new mongoose.Types.ObjectId(userId),
      status: 'delivered',
    });

    if (!order) {
      throw createError('Order not found or not delivered', 404, 'ORDER_NOT_FOUND');
    }

    // Check if product is in order
    const productInOrder = order.items.some(
      (item: any) => item.productId.toString() === productId
    );

    if (!productInOrder) {
      throw createError('Product not found in order', 400, 'PRODUCT_NOT_IN_ORDER');
    }

    // Check if review already exists
    const existingReview = await PODReview.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    });

    if (existingReview) {
      throw createError('Review already exists for this product', 400, 'REVIEW_EXISTS');
    }

    const review = await PODReview.create({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
      orderId: order._id,
      rating,
      comment,
      images: images || [],
      pros: pros || [],
      cons: cons || [],
      verifiedPurchase: true,
    });

    // Update product ratings
    const product = await PODProduct.findById(productId);
    if (product) {
      product.ratings.push(rating);
      product.reviewCount += 1;
      const sum = product.ratings.reduce((a, b) => a + b, 0);
      product.averageRating = sum / product.ratings.length;
      await product.save();
    }

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        reviewId: review.reviewId,
        rating: review.rating,
        addedAt: review.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

