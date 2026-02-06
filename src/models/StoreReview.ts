import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreReview extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreReviewSchema = new Schema<IStoreReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreProduct',
      required: true,
      index: true,
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
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StoreReviewSchema.index({ productId: 1, createdAt: -1 });
StoreReviewSchema.index({ userId: 1, productId: 1 }, { unique: true }); // One review per user per product

export const StoreReview = mongoose.model<IStoreReview>('StoreReview', StoreReviewSchema);

