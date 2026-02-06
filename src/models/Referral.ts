import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  id: string;
  referrerId: mongoose.Types.ObjectId; // User who made the referral
  referredUserId: mongoose.Types.ObjectId; // User who was referred
  referralCode: string; // The code that was used
  status: 'pending' | 'active' | 'inactive'; // Status of the referral
  totalCommissions: number; // Total commissions earned from this referral
  lastCommissionAt?: Date; // When last commission was earned
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // A user can only be referred once
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive'],
      default: 'pending',
    },
    totalCommissions: {
      type: Number,
      default: 0,
    },
    lastCommissionAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries
ReferralSchema.index({ referrerId: 1, status: 1 });

export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema);

