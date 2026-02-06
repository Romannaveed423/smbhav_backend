import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreCart extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StoreCartSchema = new Schema<IStoreCart>(
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
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StoreCartSchema.index({ userId: 1, productId: 1 }, { unique: true }); // One cart item per product per user
StoreCartSchema.index({ userId: 1 });
StoreCartSchema.index({ storeId: 1 });

export const StoreCart = mongoose.model<IStoreCart>('StoreCart', StoreCartSchema);

