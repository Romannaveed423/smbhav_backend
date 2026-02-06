import mongoose, { Schema, Document } from 'mongoose';

export interface IPODProduct extends Document {
  id: string;
  productId: string; // Display ID
  name: string;
  categoryId: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  imageUrls: string[];
  thumbnail: string;
  price: number;
  discountPrice: number;
  description: string;
  shortDescription: string;
  colors: Array<{
    id: string;
    colorCode: string;
    colorName: string;
    isAvailable: boolean;
  }>;
  sizes: Array<{
    size: string;
    isAvailable: boolean;
    price?: number;
  }>;
  materials?: string[];
  productType?: string;
  ratings: number[];
  averageRating: number;
  reviewCount: number;
  isExpressDelivery: boolean;
  expressDeliveryDays: number;
  standardDeliveryDays: number;
  expressDeliveryPrice: number;
  standardDeliveryPrice: number;
  cashbackPercentage: number;
  isActive: boolean;
  stock: {
    inStock: boolean;
    quantity: number;
  };
  specifications?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PODProductSchema = new Schema<IPODProduct>(
  {
    productId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'PODCategory',
      required: true,
      index: true,
    },
    subcategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'PODCategory',
      index: true,
    },
    imageUrls: [String],
    thumbnail: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    colors: [
      {
        id: String,
        colorCode: String,
        colorName: String,
        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],
    sizes: [
      {
        size: String,
        isAvailable: {
          type: Boolean,
          default: true,
        },
        price: Number,
      },
    ],
    materials: [String],
    productType: String,
    ratings: [Number],
    averageRating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isExpressDelivery: {
      type: Boolean,
      default: false,
    },
    expressDeliveryDays: {
      type: Number,
      default: 2,
    },
    standardDeliveryDays: {
      type: Number,
      default: 5,
    },
    expressDeliveryPrice: {
      type: Number,
      default: 99,
    },
    standardDeliveryPrice: {
      type: Number,
      default: 0,
    },
    cashbackPercentage: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stock: {
      inStock: {
        type: Boolean,
        default: true,
      },
      quantity: {
        type: Number,
        default: 0,
      },
    },
    specifications: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
PODProductSchema.index({ categoryId: 1, isActive: 1 });
PODProductSchema.index({ subcategoryId: 1, isActive: 1 });
// productId index is automatically created by unique: true
PODProductSchema.index({ name: 'text', description: 'text' }); // Text search

// Generate productId before saving
PODProductSchema.pre('save', async function(next) {
  if (this.isNew && !this.productId) {
    const count = await mongoose.model('PODProduct').countDocuments();
    this.productId = `PROD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const PODProduct = mongoose.model<IPODProduct>('PODProduct', PODProductSchema);

