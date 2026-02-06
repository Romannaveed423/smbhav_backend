import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  id: string;
  name: string;
  logo: string;
  icon: string;
  description: string;
  category: 'campaign' | 'dsa_mfd_agent' | 'social_task' | 'other_tasks' | 
            'influencer_marketing' | 'company_task' | 'freelancer_task';
  section: 'sambhav' | 'public';
  earnUpTo: number;
  taskUrl?: string; // URL where users will be redirected when they click 'Start Task'
  route: string;
  isActive: boolean;
  isNewProduct: boolean;
  details: {
    benefits: {
      payoutOpportunity: Array<{
        number: string;
        text: string;
        hasFireEmoji?: boolean;
      }>;
      customerBenefits: Array<{
        icon: string;
        text: string;
      }>;
    };
    whomToRefer?: string;
    trainingVideo?: string;
    how?: string;
  };
  marketing?: {
    materials: string[];
    links: string[];
  };
  training?: {
    videos: string[];
    documents: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['campaign', 'dsa_mfd_agent', 'social_task', 'other_tasks', 
             'influencer_marketing', 'company_task', 'freelancer_task'],
      required: true,
    },
    section: {
      type: String,
      enum: ['sambhav', 'public'],
      required: true,
    },
    earnUpTo: {
      type: Number,
      required: true,
    },
    taskUrl: {
      type: String,
      required: false,
      trim: true,
    },
    route: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    details: {
      benefits: {
        payoutOpportunity: [{
          number: String,
          text: String,
          hasFireEmoji: Boolean,
        }],
        customerBenefits: [{
          icon: String,
          text: String,
        }],
      },
      whomToRefer: String,
      trainingVideo: String,
      how: String,
    },
    marketing: {
      materials: [String],
      links: [String],
    },
    training: {
      videos: [String],
      documents: [String],
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

