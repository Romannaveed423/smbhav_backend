import mongoose, { Schema, Document } from 'mongoose';
import { BillServiceType } from './BillService';

export type BillTransactionStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'refunded';

export interface IBillTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  serviceType: BillServiceType;
  serviceName: string;
  providerCode: string;
  accountNumber: string;
  customerName?: string;
  phone?: string;
  amount: number;
  commissionAmount: number;
  status: BillTransactionStatus;
  providerTransactionId?: string;
  providerResponse?: Record<string, any>;
  errorMessage?: string;
  refundReason?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BillTransactionSchema = new Schema<IBillTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'BillService',
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      required: true,
      enum: ['mobile_recharge', 'dth_recharge', 'electricity_bill', 'gas_bill', 'water_bill'],
      index: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    providerCode: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
    },
    phone: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    providerTransactionId: {
      type: String,
    },
    providerResponse: Schema.Types.Mixed,
    errorMessage: {
      type: String,
    },
    refundReason: {
      type: String,
    },
    refundedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'billtransactions',
  }
);

BillTransactionSchema.index({ createdAt: -1 });

export const BillTransaction = mongoose.model<IBillTransaction>('BillTransaction', BillTransactionSchema);

