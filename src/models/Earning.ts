import mongoose, { Schema, Document } from 'mongoose';

export interface IEarning extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId; // Optional: may not exist for click-based tracking
  offerId?: mongoose.Types.ObjectId; // Optional: track which offer was completed
  clickId?: string; // Link to click log
  conversionId?: string; // Unique conversion identifier
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  type: string;
  earnedAt: Date;
  creditedAt?: Date;
  postbackData?: Record<string, any>; // Store postback data for reference
  postbackReceived?: boolean; // Whether postback was received
  postbackReceivedAt?: Date; // When postback was received
  approvalStatus?: 'pending' | 'auto_approved' | 'manually_approved' | 'rejected'; // Approval status
  approvedBy?: mongoose.Types.ObjectId; // Admin who approved/rejected
  approvedAt?: Date; // When it was approved/rejected
  rejectionReason?: string; // Reason for rejection if rejected
  // Referral commission tracking
  isReferralCommission?: boolean; // True if this is a commission from a referral
  referrerId?: mongoose.Types.ObjectId; // User who earned this commission (the referrer)
  referredUserId?: mongoose.Types.ObjectId; // User whose earning generated this commission
  referralCommissionRate?: number; // Commission rate used (e.g., 0.1 for 10%)
  createdAt: Date;
  updatedAt: Date;
}

const EarningSchema = new Schema<IEarning>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: false, // Made optional to support click-based tracking
    },
    offerId: {
      type: Schema.Types.ObjectId,
      ref: 'Offer',
    },
    clickId: {
      type: String,
    },
    conversionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    type: {
      type: String,
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
    creditedAt: Date,
    postbackData: Schema.Types.Mixed,
    postbackReceived: {
      type: Boolean,
      default: false,
    },
    postbackReceivedAt: Date,
    approvalStatus: {
      type: String,
      enum: ['pending', 'auto_approved', 'manually_approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: String,
    isReferralCommission: {
      type: Boolean,
      default: false,
    },
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    referralCommissionRate: Number,
  },
  {
    timestamps: true,
  }
);

// Additional indexes
EarningSchema.index({ clickId: 1 });
EarningSchema.index({ approvalStatus: 1 });
EarningSchema.index({ userId: 1, approvalStatus: 1 });
// Note: conversionId already has unique index from unique: true in schema

export const Earning = mongoose.model<IEarning>('Earning', EarningSchema);

