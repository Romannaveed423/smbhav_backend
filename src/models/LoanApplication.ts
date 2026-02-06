import mongoose, { Schema, Document } from 'mongoose';

export interface ILoanApplication extends Document {
  id: string;
  applicationId: string; // Display ID like "LOAN001"
  userId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  loanType: string;
  loanAmount: number;
  tenure: number; // In months
  personalDetails: {
    fullName: string;
    mobileNumber: string;
    panNumber?: string;
  };
  employmentDetails?: {
    employmentType: string;
    companyName?: string;
    experience?: number; // In years/months
    monthlyIncome: number;
    sourceOfIncome?: string;
  };
  eligibility?: {
    maxLoanAmount: number;
    estimatedEMI: number;
    eligibilityMessage?: string;
  };
  documents?: {
    [key: string]: string; // Document type to URL mapping
  };
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

const LoanApplicationSchema = new Schema<ILoanApplication>(
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
    loanType: {
      type: String,
      required: true,
    },
    loanAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    tenure: {
      type: Number,
      required: true,
      min: 1, // Minimum 1 month
    },
    personalDetails: {
      fullName: {
        type: String,
        required: true,
      },
      mobileNumber: {
        type: String,
        required: true,
      },
      panNumber: {
        type: String,
        uppercase: true,
        match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      },
    },
    employmentDetails: {
      employmentType: String,
      companyName: String,
      experience: Number,
      monthlyIncome: {
        type: Number,
        min: 0,
      },
      sourceOfIncome: String,
    },
    eligibility: {
      maxLoanAmount: Number,
      estimatedEMI: Number,
      eligibilityMessage: String,
    },
    documents: {
      type: Schema.Types.Mixed,
      default: {},
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
LoanApplicationSchema.index({ userId: 1, status: 1 });
LoanApplicationSchema.index({ status: 1, submittedAt: -1 });
LoanApplicationSchema.index({ kycStatus: 1 });

export const LoanApplication = mongoose.model<ILoanApplication>('LoanApplication', LoanApplicationSchema);

