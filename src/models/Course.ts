import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  thumbnail: string;
  duration: string;
  category: string;
  description?: string;
  views: number;
  rating: number;
  isPublished: boolean;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    thumbnail: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      index: true,
    },

    description: {
      type: String,
    },

    views: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ category: 1, isPublished: 1, createdAt: -1 });

export const Course = mongoose.model<ICourse>('Course', courseSchema);
