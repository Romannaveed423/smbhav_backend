import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreProduct extends Document {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  image: string;
  images: string[];
  category: mongoose.Types.ObjectId;
  rating: number;
  reviews: number;
  stock: number;
  quantityType: string; // "Pack", "Pcs", "Kg", etc.
  storeId: mongoose.Types.ObjectId;
  specifications?: Record<string, any>;
  isActive: boolean;
  isSpecialOffer: boolean;
  isHighlight: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreProductSchema = new Schema<IStoreProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    image: {
      type: String,
      required: true,
    },
    images: [String],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'StoreCategory',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityType: {
      type: String,
      required: true,
      default: 'Pcs',
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    specifications: {
      type: Schema.Types.Mixed,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSpecialOffer: {
      type: Boolean,
      default: false,
    },
    isHighlight: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StoreProductSchema.index({ storeId: 1, isActive: 1 });
StoreProductSchema.index({ category: 1, isActive: 1 });
StoreProductSchema.index({ isSpecialOffer: 1, isActive: 1 });
StoreProductSchema.index({ isHighlight: 1, isActive: 1 });
StoreProductSchema.index({ name: 'text', description: 'text' });

export const StoreProduct = mongoose.model<IStoreProduct>('StoreProduct', StoreProductSchema);

