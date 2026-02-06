import mongoose, { Schema, Document } from 'mongoose';

export interface IInsuranceApplication extends Document {
  id: string;
  applicationId: string; // Display ID like "INS001"
  userId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  insuranceType: string;
  sumAssured: number;
  paymentFrequency: string; // Monthly, Quarterly, Yearly, etc.
  policyholderDetails: {
    fullName: string;
    dateOfBirth: Date;
    contactNumber: string;
    email: string;
    address?: string;
  };
  nomineeDetails?: {
    name: string;
    relationship: string;
    dateOfBirth?: Date;
    benefitShare: number; // Percentage
  };
  healthHistory?: {
    isSmoker: boolean;
    isAlcohol: boolean;
    preExistingConditions?: string;
    pastSurgeries?: string;
    currentMedications?: string;
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

const InsuranceApplicationSchema = new Schema<IInsuranceApplication>(
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
    insuranceType: {
      type: String,
      required: true,
    },
    sumAssured: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentFrequency: {
      type: String,
      required: true,
    },
    policyholderDetails: {
      fullName: {
        type: String,
        required: true,
      },
      dateOfBirth: {
        type: Date,
        required: true,
      },
      contactNumber: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      address: String,
    },
    nomineeDetails: {
      name: String,
      relationship: String,
      dateOfBirth: Date,
      benefitShare: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    healthHistory: {
      isSmoker: {
        type: Boolean,
        default: false,
      },
      isAlcohol: {
        type: Boolean,
        default: false,
      },
      preExistingConditions: String,
      pastSurgeries: String,
      currentMedications: String,
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
InsuranceApplicationSchema.index({ userId: 1, status: 1 });
InsuranceApplicationSchema.index({ status: 1, submittedAt: -1 });
InsuranceApplicationSchema.index({ kycStatus: 1 });

export const InsuranceApplication = mongoose.model<IInsuranceApplication>('InsuranceApplication', InsuranceApplicationSchema);

