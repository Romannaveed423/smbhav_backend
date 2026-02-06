import mongoose, { Schema, Document } from 'mongoose';

export interface ICatalog extends Document {
  id: string;
  name: string;
  slug: string; // Unique, lowercase, URL-friendly
  categoryId: mongoose.Types.ObjectId; // Reference to CatalogCategory
  image: string; // URL to image (610×470px)
  status: 'Enabled' | 'Disabled';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CatalogSchema = new Schema<ICatalog>(
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
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'CatalogCategory',
      required: true,
      index: true,
    },
    image: {
      type: String,
      required: true,
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
CatalogSchema.index({ categoryId: 1, status: 1 });
// Note: slug already has an index from unique: true

export const Catalog = mongoose.model<ICatalog>('Catalog', CatalogSchema);

