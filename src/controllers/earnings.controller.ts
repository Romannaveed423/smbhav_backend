import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Offer } from '../models/Offer';
import { Application } from '../models/Application';
import { OfferApplication } from '../models/OfferApplication';
import { Earning } from '../models/Earning';
import { Withdrawal } from '../models/Withdrawal';
import { Referral } from '../models/Referral';
import { ClickLog } from '../models/ClickLog';
import { createError } from '../utils/errors';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { getFileUrl } from '../utils/fileUpload';

/**
 * Process referral commission when a referred user completes an offer
 */
async function processReferralCommission(
  referredUserId: mongoose.Types.ObjectId,
  earningAmount: number,
  originalEarningId: mongoose.Types.ObjectId
): Promise<void> {
  try {
    // Find the original earning to get productId and applicationId
    const originalEarning = await Earning.findById(originalEarningId);
    if (!originalEarning) {
      return;
    }

    // Find the user who was referred
    const referredUser = await User.findById(referredUserId);
    if (!referredUser || !referredUser.referredBy) {
      return; // User was not referred, no commission
    }

    // Find the referral relationship
    const referral = await Referral.findOne({
      referredUserId: referredUser._id,
      referrerId: referredUser.referredBy,
    });

    if (!referral) {
      return; // No referral record found
    }

    // Calculate commission (default 10% from env)
    const commissionRate = env.referralCommissionRate;
    const commissionAmount = Math.round(earningAmount * commissionRate * 100) / 100; // Round to 2 decimals

    if (commissionAmount <= 0) {
      return; // No commission to process
    }

    // Check if commission already exists for this earning
    const existingCommission = await Earning.findOne({
      isReferralCommission: true,
      referredUserId: referredUser._id,
      applicationId: originalEarning.applicationId,
    });

    if (existingCommission) {
      return; // Commission already processed
    }

    // Create commission earning for referrer
    await Earning.create({
      userId: referral.referrerId,
      productId: originalEarning.productId,
      applicationId: originalEarning.applicationId,
      amount: commissionAmount,
      status: 'completed',
      type: 'referral_commission',
      earnedAt: new Date(),
      creditedAt: new Date(),
      isReferralCommission: true,
      referrerId: referral.referrerId,
      referredUserId: referredUser._id,
      referralCommissionRate: commissionRate,
    });

    // Update referrer's wallet and stats
    await User.findByIdAndUpdate(referral.referrerId, {
      $inc: {
        walletBalance: commissionAmount,
        totalEarnings: commissionAmount,
        referralEarnings: commissionAmount,
      },
    });

    // Update referral record
    referral.totalCommissions += commissionAmount;
    referral.lastCommissionAt = new Date();
    if (referral.status === 'pending') {
      referral.status = 'active';
    }
    await referral.save();

    // Update referrer's active referrals count if this is first commission for this referral
    const isFirstCommission = await Earning.countDocuments({
      isReferralCommission: true,
      referredUserId: referredUser._id,
    }) === 1;

    if (isFirstCommission) {
      await User.findByIdAndUpdate(referral.referrerId, {
        $inc: { activeReferrals: 1 },
      });
    }
  } catch (error) {
    // Log error but don't throw - we don't want to break the main earning flow
    console.error('Error processing referral commission:', error);
  }
}

export const getEarningsDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { section = 'sambhav', category } = req.query;
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404, 'NOT_FOUND');
    }

    // Generate card number (mock implementation)
    const cardNumber = `8234 ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')} ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')} ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const expiryDate = '12/25';

    // Get total leads and sales
    const totalLeads = await Application.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    const totalSales = await Application.countDocuments({ 
      userId: new mongoose.Types.ObjectId(userId),
      status: 'approved',
    });

    // Build query for products
    const productQuery: any = {
      section: section as string,
      isActive: true,
    };
    if (category) {
      productQuery.category = category;
    }

    const products = await Product.find(productQuery).limit(10).select('name icon category section earnUpTo taskUrl route');

    res.json({
      success: true,
      data: {
        wallet: {
          balance: user.walletBalance,
          cardNumber,
          expiryDate,
          cardHolderName: user.name,
        },
        totalEarnings: user.totalEarnings,
        totalLeads,
        totalSales,
        products: products.map((product) => ({
          id: product._id.toString(),
          title: product.name,
          icon: product.icon,
          category: product.category,
          section: product.section,
          earnUpTo: product.earnUpTo,
          taskUrl: product.taskUrl || null,
          route: product.route,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEarningsProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { section, category, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      section: section as string,
      isActive: true,
    };
    if (category) {
      query.category = category;
    }

    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        products: products.map((product) => ({
          id: product._id.toString(),
          title: product.name,
          icon: product.icon,
          category: product.category,
          section: product.section,
          earnUpTo: product.earnUpTo,
          taskUrl: product.taskUrl || null,
          route: product.route,
          description: product.description,
          isActive: product.isActive,
          isNew: product.isNewProduct,
        })),
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
 * Get Offers (User-facing)
 * GET /api/v1/earn/offers
 */
export const getOffers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, search, category, section } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build query - Always filter to active offers for users
    const query: any = {
      status: 'active', // Always filter to active for users
    };

    // Date validation - Only show offers that are currently valid
    // Current date must be between startDate and endDate (or dates don't exist)
    const now = new Date();
    const dateConditions: any[] = [];

    // Offers with both startDate and endDate
    dateConditions.push({
      startDate: { $exists: true, $lte: now },
      endDate: { $exists: true, $gte: now },
    });

    // Offers with only startDate (started, no end date)
    dateConditions.push({
      startDate: { $exists: true, $lte: now },
      endDate: { $exists: false },
    });

    // Offers with only endDate (not expired yet, started anytime)
    dateConditions.push({
      startDate: { $exists: false },
      endDate: { $exists: true, $gte: now },
    });

    // Offers with no date restrictions
    dateConditions.push({
      startDate: { $exists: false },
      endDate: { $exists: false },
    });

    query.$or = dateConditions;

    // Search filter
    if (search) {
      query.name = { $regex: search as string, $options: 'i' };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Handle section filter - if provided, only include offers linked to products with that section
    if (section) {
      const productsWithSection = await Product.find({ section }).select('_id');
      const productIds = productsWithSection.map((p) => p._id);
      // Only include offers with productId matching the section, exclude standalone offers
      query.productId = { $in: productIds };
    }

    // Get offers with pagination
    const [offers, total] = await Promise.all([
      Offer.find(query)
        .select('-revenueCost -createdBy -advertiserId -accountManagerId') // Hide admin fields
        .populate({
          path: 'productId',
          select: 'name description logo icon section',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Offer.countDocuments(query),
    ]);
    const totalPages = Math.ceil(total / Number(limit));

    // Map offers to response format
    const offersData = offers.map((offer) => {
      const offerData: any = {
        _id: offer._id.toString(),
        productId: offer.productId ? (offer.productId as any)._id?.toString() || offer.productId.toString() : null,
        name: offer.name,
        description: offer.description,
        amount: offer.payoutCost || 0,
        payoutCost: offer.payoutCost,
        status: offer.status,
        category: offer.category,
      };

      // Add date fields if they exist
      if (offer.startDate) offerData.startDate = offer.startDate;
      if (offer.endDate) offerData.endDate = offer.endDate;

      // Add image URLs
      if (offer.imageUrl) offerData.imageUrl = getFileUrl(req, offer.imageUrl);
      if (offer.icon) offerData.iconUrl = getFileUrl(req, offer.icon);

      // Add other optional fields
      if (offer.clickLifeSpan) offerData.clickLifeSpan = offer.clickLifeSpan;
      if (offer.cap !== undefined) offerData.cap = offer.cap;
      if (offer.dailyCap) offerData.dailyCap = offer.dailyCap;
      if (offer.monthlyCap) offerData.monthlyCap = offer.monthlyCap;
      if (offer.payoutModel) offerData.payoutModel = offer.payoutModel;
      if (offer.payoutType) offerData.payoutType = offer.payoutType;
      if (offer.trackingLink) offerData.trackingLink = offer.trackingLink;
      if (offer.previewLink) offerData.previewLink = offer.previewLink;

      return offerData;
    });

    res.json({
      success: true,
      data: {
        offers: offersData,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductOffers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    const offers = await Offer.find({ 
      productId: new mongoose.Types.ObjectId(productId),
      status: 'active',
    });

    // Get category cards (mock data for now)
    const categoryCards = [
      {
        name: 'Credit Cards',
        icon: 'icon_url',
        earnUpTo: 46554,
        color: '#0175C2',
      },
      {
        name: 'Bank Accounts',
        icon: 'icon_url',
        earnUpTo: 4655,
        color: '#E3F2FD',
      },
    ];

    res.json({
      success: true,
      data: {
        product: {
          id: product._id.toString(),
          name: product.name,
          category: product.category,
          logo: product.logo,
        },
        categoryCards,
        activeOffers: offers.map((offer) => ({
          id: offer._id.toString(),
          name: offer.name,
          amount: offer.payoutCost || 0,
          oldPrice: offer.oldPrice,
          icon: offer.icon,
          status: offer.status,
          category: offer.category,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductDetail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    // Get user's metrics for this product
    const [totalEarning, totalLeads, totalSales] = await Promise.all([
      Earning.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            productId: new mongoose.Types.ObjectId(productId),
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Application.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        productId: new mongoose.Types.ObjectId(productId),
      }),
      Application.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        productId: new mongoose.Types.ObjectId(productId),
        status: 'approved',
      }),
    ]);

    res.json({
      success: true,
      data: {
        id: product._id.toString(),
        name: product.name,
        logo: product.logo,
        earningAmount: product.earnUpTo,
        metrics: {
          totalEarning: totalEarning[0]?.total || 0,
          totalLeads,
          totalSales,
        },
        details: product.details,
        marketing: product.marketing || { materials: [], links: [] },
        training: product.training || { videos: [], documents: [] },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const applyForProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;
    const { clientDetails, documents, offerId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    // Generate unique tracking token for postback
    const trackingToken = crypto.randomBytes(32).toString('hex');

    // Create application
    const application = await Application.create({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
      clientDetails,
      documents,
      status: 'pending',
      trackingToken,
      timeline: [
        {
          title: 'Application Submitted',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'completed',
          icon: 'check_circle',
          timestamp: new Date(),
        },
      ],
    });

    // Generate postback tracking URL
    const postbackUrl = `${env.baseUrl}/api/v1/earn/postback?token=${trackingToken}`;

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application._id.toString(),
        productId: productId,
        status: application.status,
        submittedAt: application.submittedAt,
        trackingToken,
        postbackUrl, // S2S tracking link for the advertiser/network
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;

    const application = await Application.findOne({
      _id: new mongoose.Types.ObjectId(applicationId),
      userId: new mongoose.Types.ObjectId(userId),
    }).populate('productId', 'name');

    if (!application) {
      throw createError('Application not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        applicationId: application._id.toString(),
        productName: (application.productId as any).name,
        status: application.status,
        timeline: application.timeline,
        downloadUrl: application.downloadUrl || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEarnings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (startDate || endDate) {
      query.earnedAt = {};
      if (startDate) query.earnedAt.$gte = new Date(startDate as string);
      if (endDate) query.earnedAt.$lte = new Date(endDate as string);
    }

    const [earnings, total] = await Promise.all([
      Earning.find(query)
        .populate('productId', 'name')
        .sort({ earnedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Earning.countDocuments(query),
    ]);

    // Calculate summary
    const [totalEarnings, pendingEarnings, completedEarnings, thisMonth] = await Promise.all([
      Earning.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Earning.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Earning.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Earning.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            status: 'completed',
            earnedAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        earnings: earnings.map((earning) => ({
          id: earning._id.toString(),
          productName: (earning.productId as any).name,
          amount: earning.amount,
          status: earning.status,
          type: earning.type,
          earnedAt: earning.earnedAt,
        })),
        summary: {
          totalEarnings: totalEarnings[0]?.total || 0,
          pendingEarnings: pendingEarnings[0]?.total || 0,
          completedEarnings: completedEarnings[0]?.total || 0,
          thisMonth: thisMonth[0]?.total || 0,
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

export const withdrawEarnings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { amount, bankAccount, upiId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404, 'NOT_FOUND');
    }

    if (user.walletBalance < amount) {
      throw createError('Insufficient balance', 400, 'INSUFFICIENT_BALANCE');
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      userId: new mongoose.Types.ObjectId(userId),
      amount,
      bankAccount,
      upiId,
      status: 'pending',
    });

    // Update user balance (in a real scenario, this should be done after approval)
    // For now, we'll just create the withdrawal request
    // user.walletBalance -= amount;
    // await user.save();

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        withdrawalId: withdrawal._id.toString(),
        amount: withdrawal.amount,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt,
        estimatedProcessingTime: '2-3 business days',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getWithdrawals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };
    if (status) {
      query.status = status;
    }

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query).sort({ requestedAt: -1 }).skip(skip).limit(Number(limit)),
      Withdrawal.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        withdrawals: withdrawals.map((withdrawal) => ({
          id: withdrawal._id.toString(),
          amount: withdrawal.amount,
          status: withdrawal.status,
          requestedAt: withdrawal.requestedAt,
          processedAt: withdrawal.processedAt || null,
          transactionId: withdrawal.transactionId || null,
        })),
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
 * Generate click endpoint - Creates a click log and returns tracking URL
 * This endpoint is called when a user wants to start a task/offer
 */
export const generateClick = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;
    const { taskUrl } = req.body;

    if (!userId) {
      throw createError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    // Generate UUID v4 for clickId
    const clickId = uuidv4();

    // Build postback URL with click_id
    const postbackUrl = `${env.baseUrl}/api/v1/earn/postback?click_id=${clickId}`;

    // Build redirect URL with click_id and postback_url parameters
    const redirectUrl = new URL(taskUrl);
    redirectUrl.searchParams.set('click_id', clickId);
    redirectUrl.searchParams.set('postback_url', postbackUrl);
    const redirectUrlString = redirectUrl.toString();

    // Get IP address and user agent
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referrer = req.headers.referer || req.headers.referrer || undefined;

    // Set expiration time (default 24 hours, can be configured)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create click log
    await ClickLog.create({
      clickId,
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
      offerId: req.body.offerId ? new mongoose.Types.ObjectId(req.body.offerId) : undefined,
      taskUrl,
      redirectUrl: redirectUrlString,
      ipAddress: ipAddress.toString(),
      userAgent,
      referrer,
      clickedAt: new Date(),
      expiresAt,
      status: 'pending',
      postbackReceived: false,
    });

    res.status(201).json({
      success: true,
      message: 'Click generated successfully',
      data: {
        clickId,
        redirectUrl: redirectUrlString,
        expiresAt,
        trackingUrl: postbackUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track click endpoint - Optional analytics endpoint
 * Tracks when user actually visits the task URL
 */
export const trackClick = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clickId } = req.params;

    const clickLog = await ClickLog.findOne({ clickId });
    if (!clickLog) {
      throw createError('Click not found', 404, 'NOT_FOUND');
    }

    // This is an optional analytics endpoint
    // You can log additional analytics data here if needed
    // For now, we just confirm the click exists

    res.json({
      success: true,
      message: 'Click tracked',
      data: {
        clickId,
        status: clickLog.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Postback endpoint for S2S tracking
 * This endpoint receives callbacks from advertisers/networks when an offer is completed
 * It identifies the click via click_id and creates/updates the earning
 */
export const handlePostback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { click_id } = req.query; // click_id from query parameter
    const {
      amount,
      offerId,
      status: postbackStatus,
      transactionId,
      conversionId,
      ...otherData
    } = req.body; // Additional data from postback

    if (!click_id || typeof click_id !== 'string') {
      throw createError('Click ID is required', 400, 'VALIDATION_ERROR');
    }

    // Find click log by clickId
    const clickLog = await ClickLog.findOne({ clickId: click_id })
      .populate('userId')
      .populate('productId');

    if (!clickLog) {
      throw createError('Click log not found for this click ID', 404, 'NOT_FOUND');
    }

    // Check if click has expired
    if (new Date() > clickLog.expiresAt) {
      clickLog.status = 'expired';
      await clickLog.save();
      throw createError('Click has expired', 400, 'EXPIRED_CLICK');
    }

    // Check if click is already converted or rejected
    if (clickLog.status === 'converted' || clickLog.status === 'rejected') {
      throw createError(`Click already ${clickLog.status}`, 400, 'INVALID_STATUS');
    }

    const userId = clickLog.userId as any;
    const productId = clickLog.productId as any;

    // Determine earning amount (use postback amount or product's earnUpTo)
    const earningAmount = amount || productId?.earnUpTo || 0;

    // Generate conversionId if not provided
    const finalConversionId = conversionId || `conv_${uuidv4()}`;

    // Check if earning already exists for this click or conversionId
    let earning = await Earning.findOne({
      $or: [
        { clickId: click_id },
        { conversionId: finalConversionId },
      ],
    });

    if (earning) {
      // Update existing earning if status changed to completed
      const wasPending = earning.status === 'pending';
      
      if (postbackStatus === 'completed' || postbackStatus === 'approved') {
        earning.status = 'completed';
        earning.amount = earningAmount;
        earning.creditedAt = new Date();
        earning.postbackReceived = true;
        earning.postbackReceivedAt = new Date();
        earning.approvalStatus = 'auto_approved';
        earning.conversionId = finalConversionId;
        earning.postbackData = {
          ...otherData,
          transactionId,
          conversionId: finalConversionId,
          postbackStatus,
          receivedAt: new Date(),
        };
        if (offerId) {
          earning.offerId = new mongoose.Types.ObjectId(offerId);
        }
        await earning.save();

        // Update click log
        clickLog.status = 'converted';
        clickLog.conversionId = finalConversionId;
        clickLog.postbackReceived = true;
        clickLog.postbackReceivedAt = new Date();
        await clickLog.save();

        // Only credit user if earning was previously pending (prevent double crediting)
        if (wasPending) {
          await User.findByIdAndUpdate(userId._id, {
            $inc: {
              walletBalance: earningAmount,
              totalEarnings: earningAmount,
            },
          });

          // Process referral commission if user was referred
          await processReferralCommission(userId._id, earningAmount, earning._id);
        }
      } else if (postbackStatus === 'rejected') {
        // Handle rejection
        earning.status = 'cancelled';
        earning.approvalStatus = 'rejected';
        earning.postbackReceived = true;
        earning.postbackReceivedAt = new Date();
        earning.postbackData = {
          ...otherData,
          transactionId,
          conversionId: finalConversionId,
          postbackStatus,
          receivedAt: new Date(),
        };
        await earning.save();

        clickLog.status = 'rejected';
        clickLog.postbackReceived = true;
        clickLog.postbackReceivedAt = new Date();
        await clickLog.save();
      }
    } else {
      // Create new earning record
      const earningStatus = postbackStatus === 'completed' || postbackStatus === 'approved' 
        ? 'completed' 
        : 'pending';

      // Find application (optional, for backward compatibility)
      // Note: For click-based tracking, application might not exist
      let application = null;
      if (clickLog.userId && clickLog.productId) {
        application = await Application.findOne({
          userId: clickLog.userId,
          productId: clickLog.productId,
        });
      }

      earning = await Earning.create({
        userId: userId._id,
        productId: productId._id,
        applicationId: application?._id, // Use application if exists, otherwise undefined
        offerId: offerId ? new mongoose.Types.ObjectId(offerId) : clickLog.offerId,
        clickId: click_id,
        conversionId: finalConversionId,
        amount: earningAmount,
        status: earningStatus,
        type: 'offer_completion',
        earnedAt: new Date(),
        creditedAt: earningStatus === 'completed' ? new Date() : undefined,
        postbackReceived: true,
        postbackReceivedAt: new Date(),
        approvalStatus: earningStatus === 'completed' ? 'auto_approved' : 'pending',
        postbackData: {
          ...otherData,
          transactionId,
          conversionId: finalConversionId,
          postbackStatus,
          receivedAt: new Date(),
        },
      });

      // Update click log
      clickLog.postbackReceived = true;
      clickLog.postbackReceivedAt = new Date();
      clickLog.conversionId = finalConversionId;

      if (earningStatus === 'completed') {
        clickLog.status = 'converted';
        
        // Update application status if exists
        if (application) {
          application.status = 'approved';
          application.timeline.push({
            title: 'Offer Completed',
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'completed',
            icon: 'check_circle',
            timestamp: new Date(),
          });
          await application.save();
        }

        // Update user's wallet balance and total earnings
        await User.findByIdAndUpdate(userId._id, {
          $inc: {
            walletBalance: earningAmount,
            totalEarnings: earningAmount,
          },
        });

        // Process referral commission if user was referred
        await processReferralCommission(userId._id, earningAmount, earning._id);
      } else if (postbackStatus === 'rejected') {
        clickLog.status = 'rejected';
      }
      await clickLog.save();
    }

    // Return success response (advertisers typically expect 200 OK)
    res.status(200).json({
      success: true,
      message: 'Postback received and processed',
      data: {
        earningId: earning._id.toString(),
        clickId: click_id,
        conversionId: finalConversionId,
        status: earning.status,
        amount: earning.amount,
      },
    });
  } catch (error) {
    // Log error but still return 200 to prevent postback retries
    console.error('Postback processing error:', error);
    res.status(200).json({
      success: false,
      message: 'Postback received but processing failed',
    });
  }
};

/**
 * Create Offer Application (User/Publisher)
 * POST /api/v1/earn/offer-applications
 */
export const createOfferApplication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { offerId, offerPromotion } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User ID not found', 401, 'UNAUTHORIZED');
    }

    // Validate offer exists
    const offer = await Offer.findById(offerId);
    if (!offer) {
      throw createError('Offer not found', 404, 'NOT_FOUND');
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404, 'NOT_FOUND');
    }

    // Check for duplicate pending/active applications
    const existingApplication = await OfferApplication.findOne({
      offerId: new mongoose.Types.ObjectId(offerId),
      publisherId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['Pending', 'Active'] },
    });

    if (existingApplication) {
      throw createError('You already have a pending or active application for this offer', 400, 'VALIDATION_ERROR');
    }

    // Create application
    const application = await OfferApplication.create({
      offerId: new mongoose.Types.ObjectId(offerId),
      offerName: offer.name,
      publisherId: new mongoose.Types.ObjectId(userId),
      publisherName: user.name,
      publisherEmail: user.email,
      offerPromotion,
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Offer application submitted successfully',
      data: {
        application: {
          _id: application._id.toString(),
          offerId: application.offerId.toString(),
          offerName: application.offerName,
          publisherId: application.publisherId.toString(),
          publisherName: application.publisherName,
          offerPromotion: application.offerPromotion,
          status: application.status,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

