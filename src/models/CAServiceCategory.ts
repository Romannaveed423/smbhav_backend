import mongoose, { Schema, Document } from 'mongoose';

export interface ICAServiceCategory extends Document {
  id: string;
  cat_name: string;
  cat_img: string;
  status: number; // 1 = active, 0 = inactive
  level: 'category' | 'subcategory' | 'sub_subcategory'; // Hierarchy level
  parentCategoryId?: mongoose.Types.ObjectId; // For subcategories and sub-subcategories
  order: number; // Display order
  hasCheckmark?: boolean; // For active/completed services
  description?: string; // Optional description
  createdAt: Date;
  updatedAt: Date;
}

const CAServiceCategorySchema = new Schema<ICAServiceCategory>(
  {
    cat_name: {
      type: String,
      required: true,
      trim: true,
    },
    cat_img: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
    level: {
      type: String,
      enum: ['category', 'subcategory', 'sub_subcategory'],
      default: 'category',
      required: true,
      index: true,
    },
    parentCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'CAServiceCategory',
    },
    order: {
      type: Number,
      default: 0,
    },
    hasCheckmark: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CAServiceCategorySchema.index({ level: 1, status: 1 });
CAServiceCategorySchema.index({ parentCategoryId: 1, status: 1 });
CAServiceCategorySchema.index({ level: 1, parentCategoryId: 1, status: 1 });
CAServiceCategorySchema.index({ order: 1 });

export const CAServiceCategory = mongoose.model<ICAServiceCategory>('CAServiceCategory', CAServiceCategorySchema);

