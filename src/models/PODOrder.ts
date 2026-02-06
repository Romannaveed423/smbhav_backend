import mongoose, { Schema, Document } from 'mongoose';

export interface IPODOrder extends Document {
  id: string;
  orderId: string; // Display ID like "ORD-12345"
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber?: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    productName: string;
    productImage: string;
    quantity: number;
    selectedColor: string;
    selectedSize: string;
    unitPrice: number;
    totalPrice: number;
    customization?: {
      designUrl?: string;
      text?: string;
    };
  }>;
  summary: {
    subtotal: number;
    deliveryCharges: number;
    discount: number;
    couponDiscount: number;
    total: number;
    cashback: number;
  };
  shippingAddress: {
    name: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    addressType?: string;
  };
  billingAddress?: {
    name: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  paymentMethod: {
    type: 'online' | 'cod';
    paymentId?: string;
    transactionId?: string;
  };
  deliveryType: 'express' | 'standard';
  estimatedDelivery: Date;
  deliveredAt?: Date;
  timeline: Array<{
    title: string;
    description: string;
    date: string;
    timestamp?: Date;
    completed: boolean;
    isCurrent: boolean;
  }>;
  couponCode?: string;
  notes?: string;
  placedAt: Date;
  updatedAt: Date;
}

const PODOrderSchema = new Schema<IPODOrder>(
  {
    orderId: {
      type: String,
      unique: true,
      required: false, // Auto-generated in pre-validate hook
    },
    orderNumber: {
      type: String,
      unique: true,
      required: false, // Auto-generated in pre-validate hook
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
      index: true,
    },
    trackingNumber: {
      type: String,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'PODProduct',
        },
        productName: String,
        productImage: String,
        quantity: Number,
        selectedColor: String,
        selectedSize: String,
        unitPrice: Number,
        totalPrice: Number,
        customization: {
          designUrl: String,
          text: String,
        },
      },
    ],
    summary: {
      subtotal: Number,
      deliveryCharges: Number,
      discount: Number,
      couponDiscount: Number,
      total: Number,
      cashback: Number,
    },
    shippingAddress: {
      name: String,
      phone: String,
      email: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      addressType: String,
    },
    billingAddress: {
      name: String,
      phone: String,
      email: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
    paymentMethod: {
      type: {
        type: String,
        enum: ['online', 'cod'],
      },
      paymentId: String,
      transactionId: String,
    },
    deliveryType: {
      type: String,
      enum: ['express', 'standard'],
      default: 'standard',
    },
    estimatedDelivery: Date,
    deliveredAt: Date,
    timeline: [
      {
        title: String,
        description: String,
        date: String,
        timestamp: Date,
        completed: Boolean,
        isCurrent: Boolean,
      },
    ],
    couponCode: String,
    notes: String,
    placedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PODOrderSchema.index({ userId: 1, status: 1 });
// orderId and orderNumber indexes are automatically created by unique: true
PODOrderSchema.index({ trackingNumber: 1 });

// Generate orderId and orderNumber before validation (runs before validation, so fields are available during validation)
PODOrderSchema.pre('validate', async function(next) {
  if (this.isNew) {
    try {
      if (!this.orderId) {
        const count = await mongoose.model('PODOrder').countDocuments();
        this.orderId = `ORD${String(count + 1).padStart(8, '0')}`;
      }
      if (!this.orderNumber) {
        // Use same count or generate unique number
        if (!this.orderId) {
          const count = await mongoose.model('PODOrder').countDocuments();
          this.orderNumber = `ORD-${String(count + 1).padStart(5, '0')}`;
        } else {
          // Extract number from orderId
          const num = this.orderId.replace('ORD', '');
          this.orderNumber = `ORD-${num.padStart(5, '0')}`;
        }
      }
    } catch (error) {
      // Fallback if count fails
      const timestamp = Date.now().toString().slice(-8);
      if (!this.orderId) {
        this.orderId = `ORD${timestamp}`;
      }
      if (!this.orderNumber) {
        this.orderNumber = `ORD-${timestamp.slice(-5)}`;
      }
    }
  }
  next();
});

export const PODOrder = mongoose.model<IPODOrder>('PODOrder', PODOrderSchema);

