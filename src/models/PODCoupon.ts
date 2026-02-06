import mongoose, { Schema, Document } from 'mongoose';

export interface IPODCoupon extends Document {
  id: string;
  couponCode: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number; // Total usage limit
  usageCount: number;
  userUsageLimit?: number; // Per user limit
  applicableCategories?: mongoose.Types.ObjectId[];
  applicableProducts?: mongoose.Types.ObjectId[];
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PODCouponSchema = new Schema<IPODCoupon>(
  {
    couponCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minPurchaseAmount: Number,
    maxDiscountAmount: Number,
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    usageLimit: Number,
    usageCount: {
      type: Number,
      default: 0,
    },
    userUsageLimit: Number,
    applicableCategories: [{
      type: Schema.Types.ObjectId,
      ref: 'PODCategory',
    }],
    applicableProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'PODProduct',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    description: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
PODCouponSchema.index({ couponCode: 1, isActive: 1 });
PODCouponSchema.index({ validFrom: 1, validUntil: 1 });

export const PODCoupon = mongoose.model<IPODCoupon>('PODCoupon', PODCouponSchema);

