import mongoose, { Document, Schema } from 'mongoose';
import { DOCUMENT_TYPE } from '../utils/constants';

export interface IKYCDocument extends Document {
  userId: mongoose.Types.ObjectId;
  documentType: string;
  documentUrl: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  uploadedAt: Date;
}

const KYCDocumentSchema = new Schema<IKYCDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: Object.values(DOCUMENT_TYPE),
      required: true,
    },
    documentUrl: {
      type: String,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
KYCDocumentSchema.index({ userId: 1, documentType: 1 });
KYCDocumentSchema.index({ verificationStatus: 1 });

export default mongoose.model<IKYCDocument>('KYCDocument', KYCDocumentSchema);

