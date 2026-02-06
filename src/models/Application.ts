import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  clientDetails: {
    clientName: string;
    businessName: string;
    gstin?: string;
    addressProof?: string;
  };
  documents: {
    aadhar?: string;
    pan?: string;
    addressProof?: string;
  };
  status: 'pending' | 'in_review' | 'awaiting_clarification' | 'approved' | 'rejected';
  timeline: Array<{
    title: string;
    time: string;
    status: 'completed' | 'current' | 'pending';
    icon: string;
    timestamp: Date;
  }>;
  downloadUrl?: string;
  trackingToken: string; // Unique token for postback tracking
  submittedAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
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
    clientDetails: {
      clientName: {
        type: String,
        required: true,
      },
      businessName: {
        type: String,
        required: true,
      },
      gstin: String,
      addressProof: String,
    },
    documents: {
      aadhar: String,
      pan: String,
      addressProof: String,
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'awaiting_clarification', 'approved', 'rejected'],
      default: 'pending',
    },
    timeline: [{
      title: String,
      time: String,
      status: {
        type: String,
        enum: ['completed', 'current', 'pending'],
      },
      icon: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    downloadUrl: String,
    trackingToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
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

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);

