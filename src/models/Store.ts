import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  id: string;
  name: string;
  description: string;
  status: 'open' | 'closed';
  backgroundColor: string; // Hex color
  icon: string;
  iconColor: string;
  leftImage: string;
  rating: number;
  reviews: number;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  deliveryTime: string; // e.g., "30-45 mins"
  deliveryFee: number;
  minOrder: number;
  images: string[];
  categories: string[];
  openingHours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF',
    },
    icon: {
      type: String,
      required: true,
    },
    iconColor: {
      type: String,
      default: '#000000',
    },
    leftImage: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    deliveryTime: {
      type: String,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    minOrder: {
      type: Number,
      default: 0,
    },
    images: [String],
    categories: [String],
    openingHours: {
      monday: {
        open: String,
        close: String,
      },
      tuesday: {
        open: String,
        close: String,
      },
      wednesday: {
        open: String,
        close: String,
      },
      thursday: {
        open: String,
        close: String,
      },
      friday: {
        open: String,
        close: String,
      },
      saturday: {
        open: String,
        close: String,
      },
      sunday: {
        open: String,
        close: String,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StoreSchema.index({ isActive: 1, status: 1 });
StoreSchema.index({ name: 'text', description: 'text' });
StoreSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

export const Store = mongoose.model<IStore>('Store', StoreSchema);

