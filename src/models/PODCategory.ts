import mongoose, { Schema, Document } from 'mongoose';

export interface IPODCategory extends Document {
  id: string;
  cat_name: string;
  cat_img: string;
  status: number; // 1 = active, 0 = inactive
  parentCategoryId?: mongoose.Types.ObjectId; // For subcategories
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PODCategorySchema = new Schema<IPODCategory>(
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
    parentCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'PODCategory',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PODCategorySchema.index({ parentCategoryId: 1, status: 1 });
PODCategorySchema.index({ order: 1 });

export const PODCategory = mongoose.model<IPODCategory>('PODCategory', PODCategorySchema);

