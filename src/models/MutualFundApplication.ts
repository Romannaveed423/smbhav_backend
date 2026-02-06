import mongoose, { Schema, Document } from 'mongoose';

export interface IMutualFundApplication extends Document {
  id: string;
  applicationId: string; // Display ID like "MF001"
  userId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId; // Optional reference to Product
  investmentMode: 'SIP' | 'Lumpsum';
  mutualFundStrategy?: string;
  investmentDuration?: string; // 1-3 Yrs, 3-5 Yrs, 5+ Yrs
  riskTolerance: number; // 0.0 to 1.0
  riskToleranceLabel: 'Low' | 'Moderate' | 'High';
  panNumber: string;
  aadharNumber: string;
  additionalDocument?: string; // URL to uploaded document
  investmentAmount: number;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  kycStatus: 'pending' | 'verified' | 'rejected';
  timeline: Array<{
    title: string;
    time: string | null;
    status: 'completed' | 'current' | 'pending';
    icon: string;
    timestamp?: Date;
    description?: string;
  }>;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  rejectedReason?: string;
  submittedAt: Date;
  updatedAt: Date;
}

const MutualFundApplicationSchema = new Schema<IMutualFundApplication>(
  {
    applicationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    investmentMode: {
      type: String,
      enum: ['SIP', 'Lumpsum'],
      required: true,
    },
    mutualFundStrategy: {
      type: String,
      default: null,
    },
    investmentDuration: {
      type: String,
      enum: ['1-3 Yrs', '3-5 Yrs', '5+ Yrs'],
      default: null,
    },
    riskTolerance: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    riskToleranceLabel: {
      type: String,
      enum: ['Low', 'Moderate', 'High'],
      required: true,
    },
    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    },
    aadharNumber: {
      type: String,
      required: true,
      match: /^\d{12}$/,
    },
    additionalDocument: {
      type: String,
      default: null,
    },
    investmentAmount: {
      type: Number,
      required: true,
      min: 100, // Minimum ₹100
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'rejected', 'completed'],
      default: 'pending',
      index: true,
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    timeline: [
      {
        title: String,
        time: String,
        status: {
          type: String,
          enum: ['completed', 'current', 'pending'],
        },
        icon: String,
        timestamp: Date,
        description: String,
      },
    ],
    notes: {
      type: String,
      default: null,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectedReason: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
MutualFundApplicationSchema.index({ userId: 1, status: 1 });
MutualFundApplicationSchema.index({ status: 1, submittedAt: -1 });
MutualFundApplicationSchema.index({ kycStatus: 1 });

// Note: applicationId should be generated in controller before saving

export const MutualFundApplication = mongoose.model<IMutualFundApplication>('MutualFundApplication', MutualFundApplicationSchema);

