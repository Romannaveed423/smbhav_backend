import mongoose, { Schema, Document } from 'mongoose';

export interface ICADocument extends Document {
  id: string;
  documentId: string; // Display ID
  userId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  documentType: 'aadhar' | 'pan' | 'address_proof' | 'business_proof' | 'other';
  documentUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  rejectionNote?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CADocumentSchema = new Schema<ICADocument>(
  {
    documentId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'CAApplication',
      index: true,
    },
    documentType: {
      type: String,
      enum: ['aadhar', 'pan', 'address_proof', 'business_proof', 'other'],
      required: true,
    },
    documentUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    rejectionNote: String,
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
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
CADocumentSchema.index({ userId: 1, applicationId: 1 });
CADocumentSchema.index({ verificationStatus: 1 });

// Generate documentId before saving
CADocumentSchema.pre('save', async function(next) {
  if (this.isNew && !this.documentId) {
    const count = await mongoose.model('CADocument').countDocuments();
    this.documentId = `DOC${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const CADocument = mongoose.model<ICADocument>('CADocument', CADocumentSchema);

