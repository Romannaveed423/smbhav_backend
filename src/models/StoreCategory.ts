import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreCategory extends Document {
  id: string;
  name: string;
  icon: string; // URL or asset path
  image: string;
  backgroundColor: string; // Hex color
  productCount: number;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreCategorySchema = new Schema<IStoreCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    icon: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    backgroundColor: {
      type: String,
      required: true,
      default: '#FFFFFF',
    },
    productCount: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StoreCategorySchema.index({ isActive: 1, order: 1 });
StoreCategorySchema.index({ name: 'text' });

export const StoreCategory = mongoose.model<IStoreCategory>('StoreCategory', StoreCategorySchema);

