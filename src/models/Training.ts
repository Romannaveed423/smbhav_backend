import mongoose, { Document, Schema } from 'mongoose';
import { CONTENT_TYPE } from '../utils/constants';

export interface ITraining extends Document {
  title: string;
  description?: string;
  content: {
    type: string;
    url: string;
    duration?: number;
  };
  category?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingSchema = new Schema<ITraining>(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    content: {
      type: {
        type: String,
        enum: Object.values(CONTENT_TYPE),
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      duration: Number, // in seconds for videos
    },
    category: String,
    thumbnailUrl: String,
    isActive: {
      type: Boolean,
      default: true,
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
TrainingSchema.index({ isActive: 1, order: 1 });

export default mongoose.model<ITraining>('Training', TrainingSchema);

