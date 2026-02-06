import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { Referral } from '../models/Referral';
import { generateToken, generateRefreshToken, verifyRefreshToken, verifyToken } from '../utils/jwt';
import { createError } from '../utils/errors';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, password, socialLogin, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      throw createError('User already exists', 409, 'DUPLICATE_ENTRY');
    }

    // Handle referral code if provided
    let referrer: any = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) {
        throw createError('Invalid referral code', 400, 'INVALID_REFERRAL_CODE');
      }
      // Prevent self-referral
      if (referrer.email === email || referrer.phone === phone) {
        throw createError('Cannot use your own referral code', 400, 'INVALID_REFERRAL_CODE');
      }
    }

    // Create user
    const userData: any = {
      name,
      email,
      phone,
    };

    if (socialLogin) {
      userData.socialLogin = {
        provider: socialLogin.provider,
        socialId: socialLogin.socialId,
      };
      // For social login, we might skip password or set a random one
      userData.password = crypto.randomBytes(32).toString('hex');
      userData.isEmailVerified = true; // Assume verified for social login
    } else {
      userData.password = password;
    }

    // Set referredBy if referral code is valid
    if (referrer) {
      userData.referredBy = referrer._id;
    }

    const user = await User.create(userData);

    // Create referral record if user was referred
    if (referrer) {
      await Referral.create({
        referrerId: referrer._id,
        referredUserId: user._id,
        referralCode: referralCode.toUpperCase(),
        status: 'pending',
      });

      // Update referrer's total referrals count
      await User.findByIdAndUpdate(referrer._id, {
        $inc: { totalReferrals: 1 },
      });
    }

    // Generate tokens
    const token = generateToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage || null,
          referralCode: user.referralCode,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
        refreshToken,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, socialLogin } = req.body;

    let user;

    if (socialLogin) {
      // Social login
      user = await User.findOne({
        'socialLogin.provider': socialLogin.provider,
        'socialLogin.socialId': socialLogin.socialId,
      });

      if (!user) {
        throw createError('User not found. Please register first.', 401, 'INVALID_CREDENTIALS');
      }
    } else {
      // Email/password login
      if (!email || !password) {
        throw createError('Email and password are required', 400, 'VALIDATION_ERROR');
      }

      user = await User.findOne({ email });
      if (!user) {
        throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.password) {
        throw createError('Please use social login', 401, 'INVALID_CREDENTIALS');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }
    }

    // Generate tokens
    const token = generateToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage || null,
          walletBalance: user.walletBalance,
          totalEarnings: user.totalEarnings,
          referralCode: user.referralCode,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          role: user.role || 'user',
        },
        token,
        refreshToken,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw createError('Refresh token is required', 400, 'VALIDATION_ERROR');
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      throw createError('Invalid refresh token', 401, 'UNAUTHORIZED');
    }

    const newToken = generateToken({ userId: user._id.toString(), email: user.email });

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      res.json({
        success: true,
        message: 'Password reset link sent to your email',
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // TODO: Send email with reset link
    // For now, just return success

    res.json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw createError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // In a more sophisticated implementation, you might want to blacklist the token
      // For now, we'll just clear the refresh token from the user
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);
        if (user) {
          user.refreshToken = undefined;
          await user.save();
        }
      } catch (error) {
        // Token might be expired, but that's okay for logout
      }
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

