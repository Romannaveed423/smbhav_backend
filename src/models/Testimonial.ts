import mongoose, { Schema, Document } from 'mongoose';

export interface ITestimonial extends Document {
  title: string;
  type: 'youtube' | 'text';
  video?: string;
  thumbnail?: string;
  duration?: string;
  rating: number;
  customerName: string;
  serviceType: string;
  isActive: boolean;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['youtube', 'text'],
      required: true,
      index: true,
    },

    video: {
      type: String,
    },

    thumbnail: {
      type: String,
    },

    duration: {
      type: String,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    serviceType: {
      type: String,
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

testimonialSchema.index({ type: 1, isActive: 1, createdAt: -1 });

export const Testimonial = mongoose.model<ITestimonial>(
  'Testimonial',
  testimonialSchema
);
