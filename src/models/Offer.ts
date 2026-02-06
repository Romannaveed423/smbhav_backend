import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  id: string;
  // Product association (optional for standalone offers)
  productId?: mongoose.Types.ObjectId;
  
  // Basic fields
  name: string;
  description?: string;
  advertiserId?: string;
  advertiserName?: string;
  accountManagerId?: string;
  accountManagerName?: string;
  previewLink?: string;
  trackingLink?: string; // Required for standalone offers
  category?: string;
  imageUrl?: string;
  icon?: string; // Made optional for backward compatibility
  startDate?: Date;
  endDate?: Date;
  clickLifeSpan?: number; // Days
  status: 'active' | 'inactive' | 'pending' | 'expired';
  
  // Payout fields
  payoutModel?: 'Impressions' | 'Clicks' | 'Conversions' | 'Sales' | 'Leads' | 'Installs';
  revenueCost?: number;
  payoutType?: 'Flat' | 'Revenue share';
  payoutCost?: number; // Amount field for backward compatibility
  oldPrice?: number; // For backward compatibility
  cap?: number; // 0 = no limit
  dailyCap?: number;
  monthlyCap?: number;
  payoutFileUrl?: string;
  
  // Offer settings
  conversionStatusRule?: string;
  privateSetting?: 'Enable' | 'Disable';
  redirection?: 'Enable' | 'Disable';
  requiredApproval?: 'Enable' | 'Disable';
  
  // Targeting
  geoTarget?: string; // Comma-separated country codes
  geoGlobal?: boolean;
  device?: string;
  deviceAll?: boolean;
  platform?: string;
  platformAll?: boolean;
  
  // Tracking
  trackingProtocol?: 'Postback Url' | 'Server-to-Server' | 'Pixel' | 'JavaScript';
  
  // Testing
  testUrl?: string;
  testMode?: 'Enable' | 'Disable';
  testParameters?: string;
  
  // Metadata
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    // Product association (optional)
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
      index: true,
    },
    
    // Basic fields
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
    },
    advertiserId: {
      type: String,
    },
    advertiserName: {
      type: String,
    },
    accountManagerId: {
      type: String,
    },
    accountManagerName: {
      type: String,
    },
    previewLink: {
      type: String,
    },
    trackingLink: {
      type: String,
      index: true,
    },
    category: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    icon: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    clickLifeSpan: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'expired'],
      default: 'pending',
      index: true,
    },
    
    // Payout fields
    payoutModel: {
      type: String,
      enum: ['Impressions', 'Clicks', 'Conversions', 'Sales', 'Leads', 'Installs'],
    },
    revenueCost: {
      type: Number,
    },
    payoutType: {
      type: String,
      enum: ['Flat', 'Revenue share'],
    },
    payoutCost: {
      type: Number,
    },
    oldPrice: {
      type: Number,
    },
    cap: {
      type: Number,
      default: 0,
    },
    dailyCap: {
      type: Number,
    },
    monthlyCap: {
      type: Number,
    },
    payoutFileUrl: {
      type: String,
    },
    
    // Offer settings
    conversionStatusRule: {
      type: String,
    },
    privateSetting: {
      type: String,
      enum: ['Enable', 'Disable'],
      default: 'Disable',
    },
    redirection: {
      type: String,
      enum: ['Enable', 'Disable'],
      default: 'Disable',
    },
    requiredApproval: {
      type: String,
      enum: ['Enable', 'Disable'],
      default: 'Disable',
    },
    
    // Targeting
    geoTarget: {
      type: String,
    },
    geoGlobal: {
      type: Boolean,
      default: false,
    },
    device: {
      type: String,
    },
    deviceAll: {
      type: Boolean,
      default: false,
    },
    platform: {
      type: String,
    },
    platformAll: {
      type: Boolean,
      default: false,
    },
    
    // Tracking
    trackingProtocol: {
      type: String,
      enum: ['Postback Url', 'Server-to-Server', 'Pixel', 'JavaScript'],
    },
    
    // Testing
    testUrl: {
      type: String,
    },
    testMode: {
      type: String,
      enum: ['Enable', 'Disable'],
      default: 'Disable',
    },
    testParameters: {
      type: String,
    },
    
    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for querying
OfferSchema.index({ status: 1, createdAt: -1 });
OfferSchema.index({ category: 1, status: 1 });
// trackingLink index is already defined inline above (line 101)

export const Offer = mongoose.model<IOffer>('Offer', OfferSchema);

