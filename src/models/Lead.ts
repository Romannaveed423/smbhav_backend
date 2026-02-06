import mongoose, { Document, Schema } from 'mongoose';
import { LEAD_STATUS, COMMISSION_STATUS } from '../utils/constants';

export interface ILead extends Document {
  leadNumber: string;
  agentId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: {
    city?: string;
    pincode?: string;
  };
  productId: mongoose.Types.ObjectId;
  productName: string;
  status: string;
  notes?: string;
  commissionAmount: number;
  commissionStatus: string;
  documents?: {
    documentType: string;
    documentUrl: string;
    uploadedAt: Date;
  }[];
  statusHistory: {
    status: string;
    changedAt: Date;
    changedBy?: mongoose.Types.ObjectId;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    leadNumber: {
      type: String,
      unique: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: String,
    customerAddress: {
      city: String,
      pincode: String,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: String,
    status: {
      type: String,
      enum: Object.values(LEAD_STATUS),
      default: LEAD_STATUS.NEW,
    },
    notes: String,
    commissionAmount: Number,
    commissionStatus: {
      type: String,
      enum: Object.values(COMMISSION_STATUS),
      default: COMMISSION_STATUS.PENDING,
    },
    documents: [
      {
        documentType: String,
        documentUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    statusHistory: [
      {
        status: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes (unique fields automatically get indexes)
LeadSchema.index({ agentId: 1, status: 1 }); // Compound index
LeadSchema.index({ productId: 1 });
LeadSchema.index({ createdAt: -1 });

export default mongoose.model<ILead>('Lead', LeadSchema);

