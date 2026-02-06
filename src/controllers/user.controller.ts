import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { createError } from '../utils/errors';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      throw createError('User not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage || null,
        address: user.address || null,
        walletBalance: user.walletBalance,
        totalEarnings: user.totalEarnings,
        totalWithdrawals: user.totalWithdrawals,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone, address, profileImage } = req.body;

    const user = await User.findById(req.user?.id);
    if (!user) {
      throw createError('User not found', 404, 'NOT_FOUND');
    }

    // Check if phone is being updated and if it's already taken
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        throw createError('Phone number already exists', 409, 'DUPLICATE_ENTRY');
      }
      user.phone = phone;
    }

    if (name) user.name = name;
    if (address) user.address = address;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage || null,
        address: user.address || null,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

