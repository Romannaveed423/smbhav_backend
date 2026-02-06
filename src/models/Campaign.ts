import mongoose, { Document, Schema } from 'mongoose';
import { CAMPAIGN_TYPE } from '../utils/constants';

export interface ICampaign extends Document {
  title: string;
  description?: string;
  type: string;
  target: {
    productCategory?: string;
    productId?: mongoose.Types.ObjectId;
    count?: number;
    amount?: number;
    days?: number;
  };
  reward: {
    amount: number;
    type: 'fixed' | 'percentage';
  };
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  participants: {
    userId: mongoose.Types.ObjectId;
    progress: number;
    completed: boolean;
    rewardCredited: boolean;
    creditedAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: Object.values(CAMPAIGN_TYPE),
      required: true,
    },
    target: {
      productCategory: String,
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
      count: Number,
      amount: Number,
      days: Number,
    },
    reward: {
      amount: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ['fixed', 'percentage'],
        default: 'fixed',
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        progress: {
          type: Number,
          default: 0,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        rewardCredited: {
          type: Boolean,
          default: false,
        },
        creditedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
CampaignSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);

