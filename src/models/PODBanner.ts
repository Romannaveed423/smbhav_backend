import mongoose, { Schema, Document } from 'mongoose';

export interface IPODBanner extends Document {
  id: string;
  banner: string; // Image URL
  title: string;
  subtitle?: string;
  link?: string; // Navigation link
  type: 'carousel' | 'promotional';
  order: number;
  isActive: boolean;
  backgroundColor?: string;
  imageUrl?: string; // For promotional banners
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PODBannerSchema = new Schema<IPODBanner>(
  {
    banner: String,
    title: {
      type: String,
      required: true,
    },
    subtitle: String,
    link: String,
    type: {
      type: String,
      enum: ['carousel', 'promotional'],
      required: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    backgroundColor: String,
    imageUrl: String,
    startDate: Date,
    endDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
PODBannerSchema.index({ type: 1, isActive: 1, order: 1 });

export const PODBanner = mongoose.model<IPODBanner>('PODBanner', PODBannerSchema);

