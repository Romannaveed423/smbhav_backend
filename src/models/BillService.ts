import mongoose, { Schema, Document } from 'mongoose';

export type BillServiceType =
  | 'mobile_recharge'
  | 'dth_recharge'
  | 'electricity_bill'
  | 'gas_bill'
  | 'water_bill';

export type CommissionType = 'flat' | 'percentage';

export interface IBillService extends Document {
  name: string;
  description?: string;
  type: BillServiceType;
  providerCode: string;
  icon?: string;
  minAmount: number;
  maxAmount: number;
  commissionType: CommissionType;
  commissionValue: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const BillServiceSchema = new Schema<IBillService>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    type: {
      type: String,
      required: true,
      enum: ['mobile_recharge', 'dth_recharge', 'electricity_bill', 'gas_bill', 'water_bill'],
      index: true,
    },
    providerCode: { type: String, required: true, trim: true, index: true },
    icon: { type: String },
    minAmount: { type: Number, required: true, default: 1 },
    maxAmount: { type: Number, required: true, default: 100000 },
    commissionType: {
      type: String,
      enum: ['flat', 'percentage'],
      default: 'percentage',
    },
    commissionValue: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    collection: 'billservices',
  }
);

BillServiceSchema.index({ type: 1, isActive: 1 });

export const BillService = mongoose.model<IBillService>('BillService', BillServiceSchema);

