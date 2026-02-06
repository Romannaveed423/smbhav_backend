import mongoose, { Schema, Document } from 'mongoose';

export interface ISIPApplication extends Document {
  id: string;
  applicationId: string; // Display ID like "SIP001"
  userId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId; // Optional reference to Product
  sipType: 'Regular SIP' | 'Flexible SIP' | 'Top-up SIP' | 'Tax Saving';
  monthlyInstallment: number;
  preferredSIPDate: string; // 1st, 5th, 10th, 15th, 20th
  duration: number; // In years
  assetAllocation: 'Equity' | 'Debt' | 'Hybrid';
  panNumber: string;
  aadharNumber: string;
  additionalDocument?: string; // URL to uploaded document
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

const SIPApplicationSchema = new Schema<ISIPApplication>(
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
    sipType: {
      type: String,
      enum: ['Regular SIP', 'Flexible SIP', 'Top-up SIP', 'Tax Saving'],
      required: true,
    },
    monthlyInstallment: {
      type: Number,
      required: true,
      min: 100, // Minimum ₹100
    },
    preferredSIPDate: {
      type: String,
      enum: ['1st', '5th', '10th', '15th', '20th'],
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 30, // Maximum 30 years
    },
    assetAllocation: {
      type: String,
      enum: ['Equity', 'Debt', 'Hybrid'],
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
SIPApplicationSchema.index({ userId: 1, status: 1 });
SIPApplicationSchema.index({ status: 1, submittedAt: -1 });
SIPApplicationSchema.index({ kycStatus: 1 });

// Note: applicationId should be generated in controller before saving

export const SIPApplication = mongoose.model<ISIPApplication>('SIPApplication', SIPApplicationSchema);

