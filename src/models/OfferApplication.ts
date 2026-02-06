import mongoose, { Schema, Document } from 'mongoose';

export interface IOfferApplication extends Document {
  offerId: mongoose.Types.ObjectId;
  offerName: string;
  publisherId: mongoose.Types.ObjectId;
  publisherName: string;
  publisherEmail: string;
  offerPromotion: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Active';
  rejectionReason?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OfferApplicationSchema = new Schema<IOfferApplication>(
  {
    offerId: {
      type: Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
      index: true,
    },
    offerName: {
      type: String,
      required: true,
    },
    publisherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    publisherName: {
      type: String,
      required: true,
    },
    publisherEmail: {
      type: String,
      required: true,
    },
    offerPromotion: {
      type: String,
      required: true,
      minlength: 10,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Active'],
      default: 'Pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
OfferApplicationSchema.index({ offerId: 1, publisherId: 1, status: 1 });
OfferApplicationSchema.index({ status: 1, createdAt: -1 });

export const OfferApplication = mongoose.model<IOfferApplication>(
  'OfferApplication',
  OfferApplicationSchema
);

