import mongoose, { Schema, Document } from 'mongoose';

export interface ICAService extends Document {
  id: string;
  title: string;
  description: string;
  logo: string;
  price: number;
  cross_price?: number; // Strikethrough price
  categoryId: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  estimatedTime: string; // "7-10 days"
  isActive: boolean;
  features: string[];
  requiredDocuments: Array<{
    name: string;
    type: string;
    isRequired: boolean;
  }>;
  processSteps: string[];
  serviceType: string; // gst_registration, company_registration, etc.
  createdAt: Date;
  updatedAt: Date;
}

const CAServiceSchema = new Schema<ICAService>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    cross_price: {
      type: Number,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'CAServiceCategory',
      required: true,
      index: true,
    },
    subcategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'CAServiceCategory',
      index: true,
    },
    estimatedTime: {
      type: String,
      default: '7-10 days',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    features: [String],
    requiredDocuments: [
      {
        name: String,
        type: String,
        isRequired: {
          type: Boolean,
          default: true,
        },
      },
    ],
    processSteps: [String],
    serviceType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CAServiceSchema.index({ categoryId: 1, isActive: 1 });
CAServiceSchema.index({ subcategoryId: 1, isActive: 1 });
CAServiceSchema.index({ serviceType: 1 });

export const CAService = mongoose.model<ICAService>('CAService', CAServiceSchema);

