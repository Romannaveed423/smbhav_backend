import mongoose, { Schema, Document } from 'mongoose';

export interface ICatalogCategory extends Document {
  id: string;
  name: string;
  slug: string; // Unique, lowercase, URL-friendly
  description?: string;
  image: string; // URL to image (610×470px)
  feature: 'General' | 'Featured';
  status: 'Enabled' | 'Disabled';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CatalogCategorySchema = new Schema<ICatalogCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      default: null,
    },
    image: {
      type: String,
      required: true,
    },
    feature: {
      type: String,
      enum: ['General', 'Featured'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Enabled', 'Disabled'],
      default: 'Enabled',
      index: true,
    },
    seoTitle: {
      type: String,
      default: null,
    },
    seoDescription: {
      type: String,
      default: null,
    },
    seoKeywords: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CatalogCategorySchema.index({ feature: 1, status: 1 });
// Note: slug already has an index from unique: true

export const CatalogCategory = mongoose.model<ICatalogCategory>('CatalogCategory', CatalogCategorySchema);

