import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CACallback } from '../../models/CACallback';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * Request callback
 */
export const requestCallback = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { phoneNumber, preferredTime, applicationId, reason } = req.body;

    if (!phoneNumber) {
      throw createError('Phone number is required', 400, 'VALIDATION_ERROR');
    }

    const callback = await CACallback.create({
      userId: new mongoose.Types.ObjectId(userId),
      phoneNumber,
      preferredTime: preferredTime || 'Anytime',
      applicationId: applicationId ? new mongoose.Types.ObjectId(applicationId) : undefined,
      reason: reason || '',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Callback request submitted successfully',
      data: {
        callbackId: callback.callbackId,
        requestedAt: callback.requestedAt,
        estimatedCallbackTime: 'Within 2 hours',
        status: callback.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get support phone number
 */
export const getSupportPhone = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supportPhone = process.env.CA_SUPPORT_PHONE || '+911234567890';

    const now = new Date();
    const currentHour = now.getHours();
    const isAvailable = currentHour >= 9 && currentHour < 18; // 9 AM – 6 PM

    let callbackId: string | null = null;

    // 🔹 If user is logged in, log call intent
    if (req.user?.id) {
      const callback = await CACallback.create({
        callbackId: `CALL${Date.now()}`,
        userId: req.user.id,
        phone: supportPhone,
        status: 'pending',
        source: 'call_now',
        requestedAt: now,
      });

      callbackId = callback.callbackId;
    }

    res.json({
      success: true,
      data: {
        phoneNumber: supportPhone,
        availableHours: '9:00 AM - 6:00 PM',
        availableDays: 'Monday - Saturday',
        isAvailable,
        callbackId, // admin can track this
        message: isAvailable
          ? 'You can call now'
          : 'Support is currently offline. We will call you back.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all callback requests (Admin)
 */
export const getAllCallbacks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Admin / CA only
    if(!req.user || !['admin', 'ca'].includes(req.user.role)){
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    const query: any = {};
    if (status) query.status = status;

    const [callbacks, total] = await Promise.all([
      CACallback.find(query)
        .populate('userId', 'name email')
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CACallback.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        callbacks,
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
 * Get callback details by ID (Admin)
 */
export const getCallbackById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { callbackId } = req.params;

    // Admin / CA only
    if(!req.user || !['admin', 'ca'].includes(req.user.role)){
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    const callback = await CACallback.findOne({ callbackId }).populate('userId', 'name email');

    if (!callback) {
      throw createError('Callback request not found', 404, 'NOT_FOUND');
    } 
    res.json({
      success: true,
      data: callback,
    });
  }
  catch (error) {
    next(error);
  }
};

/**
 * Update callback status (Admin)
 */
export const updateCallbackStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { callbackId } = req.params;
    const { status, reason} = req.body;

    // Admin / CA only
    if(!req.user || !['admin', 'ca'].includes(req.user.role)){
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    const callback = await CACallback.findOne({ callbackId });

    if (!callback) {
      throw createError('Callback request not found', 404, 'NOT_FOUND');
    }

    callback.status = status;
    callback.reason = reason || '';
    await callback.save();

    res.json({
      success: true,
      message: 'Callback status updated successfully',
      data: {
        callbackId: callback.callbackId,
        status: callback.status,
        reason: callback.reason,
      },
    });
  } catch (error) {
    next(error);
  }
};  

/**
 * List all callbacks for a user
 */
export const getUserCallbacks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [callbacks, total] = await Promise.all([
      CACallback.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CACallback.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    ]);
    
    res.json({
      success: true,
      data: {
        callbacks,
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
 * Get callback details by ID for user
 */
export const getUserCallbackById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction  
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { callbackId } = req.params;
    const callback = await CACallback.findOne({ callbackId, userId: new mongoose.Types.ObjectId(userId) }); 
    if (!callback) {
      throw createError('Callback request not found', 404, 'NOT_FOUND');
    }
    res.json({
      success: true,
      data: {
        callbackId: callback.callbackId,
        requestedAt: callback.requestedAt,
        preferredTime: callback.preferredTime,
        status: callback.status,
        reason: callback.reason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** * Cancel callback request by user
 */
export const cancelUserCallback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { callbackId } = req.params;
    const callback = await CACallback.findOne({ callbackId, userId: new mongoose.Types.ObjectId(userId) });
    if (!callback) {
      throw createError('Callback request not found', 404, 'NOT_FOUND');
    } 
    if (callback.status !== 'pending') {
      throw createError('Only pending callbacks can be cancelled', 400, 'INVALID_OPERATION');
    }
    callback.status = 'cancelled';
    await callback.save();
    res.json({
      success: true,
      message: 'Callback request cancelled successfully',
      data: {
        callbackId: callback.callbackId,
        status: callback.status,
      },
    });
  } catch (error) {
    next(error);
  }
};


