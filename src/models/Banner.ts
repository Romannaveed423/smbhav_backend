import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  linkType: 'product' | 'store' | 'category' | 'url';
  order: number;
  isActive: boolean;
  locationId?: mongoose.Types.ObjectId; // Optional location-specific banner
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    linkType: {
      type: String,
      enum: ['product', 'store', 'category', 'url'],
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BannerSchema.index({ isActive: 1, order: 1 });
BannerSchema.index({ locationId: 1, isActive: 1 });

export const Banner = mongoose.model<IBanner>('Banner', BannerSchema);

