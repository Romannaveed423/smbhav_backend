import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  profileImage?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  walletBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  role?: 'user' | 'admin'; // User role, default is 'user'
  status: 'active' | 'inactive' | 'frozen'; // Account status for admin control
  freezeReason?: string; // Reason when status is frozen (audit)
  lastLogin?: Date; // Last login timestamp
  socialLogin?: {
    provider: 'google' | 'facebook';
    socialId: string;
  };
  // Affiliate/Referral fields
  referralCode: string; // Unique code for this user to share
  referredBy?: mongoose.Types.ObjectId; // User who referred this user
  referralEarnings: number; // Total earnings from referrals
  totalReferrals: number; // Total number of users referred
  activeReferrals: number; // Number of active referrals (who have earned)
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 10,
      maxlength: 15,
      index: true,
    },
    password: {
      type: String,
      required: function(this: IUser) {
        return !this.socialLogin;
      },
    },
    profileImage: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    referralEarnings: {
      type: Number,
      default: 0,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    activeReferrals: {
      type: Number,
      default: 0,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'frozen'],
      default: 'active',
      index: true,
    },
    freezeReason: { type: String },
    lastLogin: { type: Date },
    socialLogin: {
      provider: {
        type: String,
        enum: ['google', 'facebook'],
      },
      socialId: String,
    },
    refreshToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Generate referral code before saving (if new user)
UserSchema.pre('save', async function(next) {
  if (this.isNew && !this.referralCode) {
    // Generate unique referral code (8 characters, alphanumeric uppercase)
    let code: string;
    let isUnique = false;
    const UserModel = this.constructor as mongoose.Model<IUser>;
    do {
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const existing = await UserModel.findOne({ referralCode: code });
      isUnique = !existing;
    } while (!isUnique);
    this.referralCode = code;
  }
  next();
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);

