import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../middleware/admin';
import { Product } from '../../models/Product';
import { ClickLog } from '../../models/ClickLog';
import { Earning } from '../../models/Earning';
import { Application } from '../../models/Application';
import { User } from '../../models/User';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * Get Dashboard Summary (Admin)
 */
export const getDashboardSummary = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, section, category } = req.query;

    const dateQuery: any = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate as string);
    }

    const productQuery: any = {};
    if (section) productQuery.section = section;
    if (category) productQuery.category = category;

    const [
      totalEarnings,
      pendingEarnings,
      completedEarnings,
      totalClicks,
      convertedClicks,
      totalApplications,
      approvedApplications,
      totalUsers,
      categoryBreakdown,
      topProducts,
    ] = await Promise.all([
      // Total earnings amount
      Earning.aggregate([
        { $match: { status: 'completed', ...dateQuery } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Pending earnings
      Earning.aggregate([
        { $match: { status: 'pending', ...dateQuery } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Completed earnings
      Earning.aggregate([
        { $match: { status: 'completed', ...dateQuery } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Total clicks
      ClickLog.countDocuments(dateQuery),
      // Converted clicks
      ClickLog.countDocuments({ status: 'converted', ...dateQuery }),
      // Total applications
      Application.countDocuments(dateQuery),
      // Approved applications
      Application.countDocuments({ status: 'approved', ...dateQuery }),
      // Total users
      User.countDocuments(),
      // Category breakdown
      Earning.aggregate([
        {
          $match: { status: 'completed', ...dateQuery },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $unwind: { path: '$product', preserveNullAndEmptyArrays: true },
        },
        {
          $match: productQuery.section || productQuery.category ? productQuery : {},
        },
        {
          $group: {
            _id: '$product.category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
      // Top products
      Earning.aggregate([
        {
          $match: { status: 'completed', ...dateQuery },
        },
        {
          $group: {
            _id: '$productId',
            totalEarnings: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalEarnings: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
      ]),
    ]);

    // Get recent activity (last 10 conversions)
    const recentActivity = await Earning.find({ status: 'completed', ...dateQuery })
      .populate('userId', 'name email')
      .populate('productId', 'name')
      .sort({ earnedAt: -1 })
      .limit(10)
      .select('amount earnedAt status');

    res.json({
      success: true,
      data: {
        summary: {
          totalEarnings: totalEarnings[0]?.total || 0,
          pendingEarnings: {
            amount: pendingEarnings[0]?.total || 0,
            count: pendingEarnings[0]?.count || 0,
          },
          completedEarnings: {
            amount: completedEarnings[0]?.total || 0,
            count: completedEarnings[0]?.count || 0,
          },
          totalClicks,
          convertedClicks,
          conversionRate: totalClicks > 0 ? ((convertedClicks / totalClicks) * 100).toFixed(2) : '0.00',
          totalApplications,
          approvedApplications,
          approvalRate: totalApplications > 0 ? ((approvedApplications / totalApplications) * 100).toFixed(2) : '0.00',
          totalUsers,
        },
        categoryBreakdown: categoryBreakdown.map((cat) => ({
          category: cat._id || 'Unknown',
          totalEarnings: cat.total,
          count: cat.count,
        })),
        topProducts: topProducts.map((p) => ({
          productId: p._id.toString(),
          productName: p.product.name,
          totalEarnings: p.totalEarnings,
          conversions: p.count,
        })),
        recentActivity: recentActivity.map((a) => ({
          id: a._id.toString(),
          amount: a.amount,
          user: {
            name: (a.userId as any).name,
            email: (a.userId as any).email,
          },
          product: {
            name: (a.productId as any).name,
          },
          earnedAt: a.earnedAt,
        })),
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
          section: section || null,
          category: category || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Product Analytics (Admin)
 */
export const getProductAnalytics = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const dateQuery: any = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate as string);
    }

    // Build group format based on groupBy
    let groupFormat: any = {};
    if (groupBy === 'day') {
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
    } else if (groupBy === 'week') {
      groupFormat = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' },
      };
    } else if (groupBy === 'month') {
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
    }

    // Clicks time series
    const clicksTimeSeries = await ClickLog.aggregate([
      {
        $match: {
          productId: productObjectId,
          ...dateQuery,
        },
      },
      {
        $group: {
          _id: groupFormat,
          clicks: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
    ]);

    // Conversions time series
    const conversionsTimeSeries = await Earning.aggregate([
      {
        $match: {
          productId: productObjectId,
          status: 'completed',
          ...dateQuery,
        },
      },
      {
        $group: {
          _id: groupFormat,
          conversions: { $sum: 1 },
          earnings: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        product: {
          id: product._id.toString(),
          name: product.name,
        },
        clicks: clicksTimeSeries.map((item) => ({
          date: `${item._id.year}-${String(item._id.month || item._id.week || 1).padStart(2, '0')}-${String(item._id.day || 1).padStart(2, '0')}`,
          clicks: item.clicks,
          converted: item.converted,
        })),
        conversions: conversionsTimeSeries.map((item) => ({
          date: `${item._id.year}-${String(item._id.month || item._id.week || 1).padStart(2, '0')}-${String(item._id.day || 1).padStart(2, '0')}`,
          conversions: item.conversions,
          earnings: item.earnings,
        })),
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
          groupBy,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

