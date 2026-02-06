import mongoose, { Schema, Document } from 'mongoose';

export interface IPODCart extends Document {
  id: string;
  cartItemId: string;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  selectedColor: {
    id: string;
    colorCode: string;
    colorName: string;
  };
  selectedSize: string;
  customization?: {
    designUrl?: string;
    text?: string;
    textColor?: string;
    font?: string;
    position?: string;
  };
  deliveryType: 'express' | 'standard';
  unitPrice: number;
  totalPrice: number;
  deliveryPrice: number;
  estimatedDelivery: Date;
  notes?: string;
  addedAt: Date;
  updatedAt: Date;
}

const PODCartSchema = new Schema<IPODCart>(
  {
    cartItemId: {
      type: String,
      unique: true,
      required: false, // Auto-generated in pre-save hook, so not required in schema
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'PODProduct',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    selectedColor: {
      id: String,
      colorCode: String,
      colorName: String,
    },
    selectedSize: {
      type: String,
      required: false, // Make it optional, we'll handle validation in controller
    },
    customization: {
      designUrl: String,
      text: String,
      textColor: String,
      font: String,
      position: String,
    },
    deliveryType: {
      type: String,
      enum: ['express', 'standard'],
      default: 'standard',
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    deliveryPrice: {
      type: Number,
      default: 0,
    },
    estimatedDelivery: {
      type: Date,
      required: true,
    },
    notes: String,
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PODCartSchema.index({ userId: 1 });
PODCartSchema.index({ productId: 1 });

// Generate cartItemId before validation (runs before validation, so cartItemId is available during validation)
PODCartSchema.pre('validate', async function(next) {
  if (this.isNew && !this.cartItemId) {
    try {
      const count = await mongoose.model('PODCart').countDocuments();
      this.cartItemId = `CART${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      // Fallback if count fails
      this.cartItemId = `CART${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

export const PODCart = mongoose.model<IPODCart>('PODCart', PODCartSchema);

