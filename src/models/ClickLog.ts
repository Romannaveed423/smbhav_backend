import mongoose, { Schema, Document } from 'mongoose';

export interface IClickLog extends Document {
  id: string;
  clickId: string; // UUID v4 - unique click identifier
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  offerId?: mongoose.Types.ObjectId;
  taskUrl: string; // The URL user should visit to complete the task
  redirectUrl: string; // Final URL with click_id and postback_url
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  clickedAt: Date;
  expiresAt: Date; // Click expiration time (typically 24-48 hours)
  status: 'pending' | 'converted' | 'expired' | 'rejected';
  conversionId?: string; // Unique conversion identifier from postback
  postbackReceived: boolean;
  postbackReceivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClickLogSchema = new Schema<IClickLog>(
  {
    clickId: {
      type: String,
      required: true,
      unique: true,
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
      required: true,
      index: true,
    },
    offerId: {
      type: Schema.Types.ObjectId,
      ref: 'Offer',
      index: true,
    },
    taskUrl: {
      type: String,
      required: true,
    },
    redirectUrl: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    referrer: {
      type: String,
    },
    clickedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'converted', 'expired', 'rejected'],
      default: 'pending',
      index: true,
    },
    conversionId: {
      type: String,
      sparse: true,
    },
    postbackReceived: {
      type: Boolean,
      default: false,
    },
    postbackReceivedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
ClickLogSchema.index({ userId: 1, status: 1 });
ClickLogSchema.index({ productId: 1, status: 1 });
ClickLogSchema.index({ offerId: 1, status: 1 });
ClickLogSchema.index({ offerId: 1, createdAt: -1 });
ClickLogSchema.index({ clickId: 1, status: 1 });

export const ClickLog = mongoose.model<IClickLog>('ClickLog', ClickLogSchema);

