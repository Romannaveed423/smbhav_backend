import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../middleware/admin';
import { Offer } from '../../models/Offer';
import { Product } from '../../models/Product';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';
import { getFileUrl } from '../../utils/fileUpload';

/**
 * List Offers (Admin)
 * GET /api/v1/admin/earn/offers
 */
export const listOffers = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, search, advertiser, category, createdBy } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Search by name
    if (search) {
      query.name = { $regex: search as string, $options: 'i' };
    }

    // Advertiser filter (skip if 'All')
    if (advertiser && advertiser !== 'All') {
      query.advertiserName = advertiser;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Created by filter
    if (createdBy) {
      query.createdBy = new mongoose.Types.ObjectId(createdBy as string);
    }

    // Get offers with pagination
    const [offers, total] = await Promise.all([
      Offer.find(query)
        .populate('productId', 'name')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Offer.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    // Map offers to response format
    const offersData = offers.map((offer) => {
      // Handle productId - can be ObjectId or populated document
      let productId = null;
      if (offer.productId) {
        if (typeof offer.productId === 'object' && (offer.productId as any)._id) {
          productId = (offer.productId as any)._id.toString();
        } else {
          productId = offer.productId.toString();
        }
      }

      return {
        _id: offer._id.toString(),
        productId,
        name: offer.name,
        description: offer.description,
        amount: offer.payoutCost || 0, // Map payoutCost to amount for frontend
        payoutCost: offer.payoutCost,
        revenueCost: offer.revenueCost,
        payoutModel: offer.payoutModel,
        payoutType: offer.payoutType,
        trackingLink: offer.trackingLink,
        previewLink: offer.previewLink,
        category: offer.category,
        imageUrl: offer.imageUrl ? getFileUrl(req, offer.imageUrl) : undefined,
        iconUrl: offer.icon ? getFileUrl(req, offer.icon) : undefined,
        status: offer.status,
        startDate: offer.startDate,
        endDate: offer.endDate,
        clickLifeSpan: offer.clickLifeSpan,
        cap: offer.cap,
        dailyCap: offer.dailyCap,
        monthlyCap: offer.monthlyCap,
        geoTarget: offer.geoTarget,
        geoGlobal: offer.geoGlobal,
        device: offer.device,
        deviceAll: offer.deviceAll,
        platform: offer.platform,
        platformAll: offer.platformAll,
        trackingProtocol: offer.trackingProtocol,
        advertiserId: offer.advertiserId,
        advertiserName: offer.advertiserName,
        accountManagerId: offer.accountManagerId,
        accountManagerName: offer.accountManagerName,
        createdBy: offer.createdBy ? (offer.createdBy as any)._id?.toString() || offer.createdBy.toString() : undefined,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      };
    });

    res.json({
      success: true,
      data: {
        offers: offersData,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Product Offers (Admin)
 */
export const getProductOffers = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    const offers = await Offer.find({ productId: new mongoose.Types.ObjectId(productId) }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        product: {
          id: product._id.toString(),
          name: product.name,
        },
        offers: offers.map((offer) => ({
          id: offer._id.toString(),
          name: offer.name,
          amount: offer.amount,
          oldPrice: offer.oldPrice,
          icon: getFileUrl(req, offer.icon),
          status: offer.status,
          category: offer.category,
          createdAt: offer.createdAt,
          updatedAt: offer.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Offer (Admin)
 */
export const createOffer = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const { name, amount, oldPrice, status, category } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    // Handle icon upload
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;
    const iconFile = Array.isArray(files) ? files[0] : files?.['icon']?.[0];
    const icon = iconFile
      ? `/uploads/earnings/products/${iconFile.filename}`
      : req.body.icon || '/uploads/default-offer-icon.png';

    const offer = await Offer.create({
      productId: new mongoose.Types.ObjectId(productId),
      name,
      amount: Number(amount),
      oldPrice: Number(oldPrice || amount),
      icon,
      status: status || 'active',
      category: category || product.category,
    });

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: {
        id: offer._id.toString(),
        name: offer.name,
        amount: offer.amount,
        oldPrice: offer.oldPrice,
        icon: getFileUrl(req, offer.icon),
        status: offer.status,
        createdAt: offer.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Offer (Admin)
 */
export const updateOffer = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { offerId } = req.params;
    const updateData: any = {};

    const offer = await Offer.findById(offerId);
    if (!offer) {
      throw createError('Offer not found', 404, 'NOT_FOUND');
    }

    // Handle icon upload
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;
    const iconFile = Array.isArray(files) ? files[0] : files?.['icon']?.[0];
    if (iconFile) {
      updateData.icon = `/uploads/earnings/products/${iconFile.filename}`;
    } else if (req.body.icon) {
      updateData.icon = req.body.icon;
    }

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.amount !== undefined) updateData.amount = Number(req.body.amount);
    if (req.body.oldPrice !== undefined) updateData.oldPrice = Number(req.body.oldPrice);
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.category) updateData.category = req.body.category;

    const updatedOffer = await Offer.findByIdAndUpdate(offerId, updateData, { new: true });

    res.json({
      success: true,
      message: 'Offer updated successfully',
      data: {
        id: updatedOffer!._id.toString(),
        name: updatedOffer!.name,
        amount: updatedOffer!.amount,
        oldPrice: updatedOffer!.oldPrice,
        icon: getFileUrl(req, updatedOffer!.icon),
        status: updatedOffer!.status,
        updatedAt: updatedOffer!.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Offer (Admin)
 */
export const deleteOffer = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { offerId } = req.params;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      throw createError('Offer not found', 404, 'NOT_FOUND');
    }

    await Offer.findByIdAndDelete(offerId);

    res.json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Standalone Offer (Admin)
 * POST /api/v1/admin/earn/offers
 */
export const createStandaloneOffer = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // Extract all fields from request body
    const {
      // Basic fields
      name,
      description,
      advertiserId,
      advertiserName,
      accountManagerId,
      accountManagerName,
      previewLink,
      trackingLink,
      category,
      startDate,
      endDate,
      clickLifeSpan,
      status,
      
      // Payout fields
      payoutModel,
      revenueCost,
      payoutType,
      payoutCost,
      cap,
      dailyCap,
      monthlyCap,
      
      // Offer settings
      conversionStatusRule,
      privateSetting,
      redirection,
      requiredApproval,
      
      // Targeting
      geoTarget,
      geoGlobal,
      device,
      deviceAll,
      platform,
      platformAll,
      
      // Tracking
      trackingProtocol,
      
      // Testing
      testUrl,
      testMode,
      testParameters,
    } = req.body;

    // Validate required fields
    if (!name || !trackingLink) {
      throw createError('Name and tracking link are required', 400, 'VALIDATION_ERROR');
    }

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const imageFile = files?.['image']?.[0];
    const iconFile = files?.['icon']?.[0];
    const payoutFile = files?.['payoutFile']?.[0];

    // Helper function to convert string booleans/numbers to proper types
    const toBool = (value: any): boolean | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === '1') return true;
        if (lower === 'false' || lower === '0') return false;
      }
      return undefined;
    };

    const toNumber = (value: any): number | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    };

    const toInt = (value: any): number | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'number') return Math.floor(value);
      if (typeof value === 'string') {
        const num = parseInt(value, 10);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    };

    // Build offer data
    const offerData: any = {
      name,
      description: description || undefined,
      advertiserId: advertiserId || undefined,
      advertiserName: advertiserName || undefined,
      accountManagerId: accountManagerId || undefined,
      accountManagerName: accountManagerName || undefined,
      previewLink: previewLink || undefined,
      trackingLink,
      category: category || undefined,
      imageUrl: imageFile ? `/uploads/earnings/products/${imageFile.filename}` : undefined,
      icon: iconFile ? `/uploads/earnings/products/${iconFile.filename}` : undefined,
      payoutFileUrl: payoutFile ? `/uploads/earnings/products/${payoutFile.filename}` : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      clickLifeSpan: toInt(clickLifeSpan),
      status: status || 'pending',
      
      // Payout
      payoutModel: payoutModel || undefined,
      revenueCost: toNumber(revenueCost),
      payoutType: payoutType || undefined,
      payoutCost: toNumber(payoutCost),
      cap: toInt(cap),
      dailyCap: dailyCap !== undefined && dailyCap !== null && dailyCap !== '' ? toInt(dailyCap) : undefined,
      monthlyCap: monthlyCap !== undefined && monthlyCap !== null && monthlyCap !== '' ? toInt(monthlyCap) : undefined,
      
      // Offer settings
      conversionStatusRule: conversionStatusRule || undefined,
      privateSetting: privateSetting || 'Disable',
      redirection: redirection || 'Disable',
      requiredApproval: requiredApproval || 'Disable',
      
      // Targeting
      geoTarget: geoTarget || undefined,
      geoGlobal: toBool(geoGlobal) ?? false,
      device: device || undefined,
      deviceAll: toBool(deviceAll) ?? false,
      platform: platform || undefined,
      platformAll: toBool(platformAll) ?? false,
      
      // Tracking
      trackingProtocol: trackingProtocol || undefined,
      
      // Testing
      testUrl: testUrl || undefined,
      testMode: testMode || 'Disable',
      testParameters: testParameters || undefined,
      
      // Metadata
      createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    };

    // Create the offer
    const offer = await Offer.create(offerData);

    // Build response
    const responseData: any = {
      _id: offer._id.toString(),
      name: offer.name,
      description: offer.description,
      advertiserName: offer.advertiserName,
      accountManagerName: offer.accountManagerName,
      previewLink: offer.previewLink,
      trackingLink: offer.trackingLink,
      category: offer.category,
      status: offer.status,
      payoutModel: offer.payoutModel,
      payoutCost: offer.payoutCost,
      revenueCost: offer.revenueCost,
      trackingProtocol: offer.trackingProtocol,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    };

    if (offer.imageUrl) {
      responseData.imageUrl = getFileUrl(req, offer.imageUrl);
    }
    if (offer.icon) {
      responseData.iconUrl = getFileUrl(req, offer.icon);
    }
    if (offer.payoutFileUrl) {
      responseData.payoutFileUrl = getFileUrl(req, offer.payoutFileUrl);
    }

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: {
        offer: responseData,
      },
    });
  } catch (error) {
    next(error);
  }
};

