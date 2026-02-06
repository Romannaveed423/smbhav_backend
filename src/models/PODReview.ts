import mongoose, { Schema, Document } from 'mongoose';

export interface IPODReview extends Document {
  id: string;
  reviewId: string;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId; // To verify purchase
  rating: number; // 1-5
  comment: string;
  images?: string[];
  pros?: string[];
  cons?: string[];
  verifiedPurchase: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

const PODReviewSchema = new Schema<IPODReview>(
  {
    reviewId: {
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
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'PODProduct',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'PODOrder',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    images: [String],
    pros: [String],
    cons: [String],
    verifiedPurchase: {
      type: Boolean,
      default: true,
    },
    helpful: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PODReviewSchema.index({ productId: 1, createdAt: -1 });
PODReviewSchema.index({ userId: 1, productId: 1 }, { unique: true }); // One review per user per product

// Generate reviewId before saving
PODReviewSchema.pre('save', async function(next) {
  if (this.isNew && !this.reviewId) {
    const count = await mongoose.model('PODReview').countDocuments();
    this.reviewId = `REV${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const PODReview = mongoose.model<IPODReview>('PODReview', PODReviewSchema);

