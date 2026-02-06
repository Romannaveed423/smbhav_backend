import mongoose, { Document, Schema } from 'mongoose';
import { TRANSACTION_TYPE, TRANSACTION_STATUS } from '../utils/constants';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  amount: number;
  status: string;
  description?: string;
  relatedEntity?: {
    type: 'lead' | 'referral' | 'campaign' | 'withdrawal';
    id: mongoose.Types.ObjectId;
  };
  metadata?: {
    leadNumber?: string;
    campaignId?: mongoose.Types.ObjectId;
    referralCode?: string;
  };
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPE),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
    },
    description: String,
    relatedEntity: {
      type: {
        type: String,
        enum: ['lead', 'referral', 'campaign', 'withdrawal'],
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
    metadata: {
      leadNumber: String,
      campaignId: {
        type: Schema.Types.ObjectId,
        ref: 'Campaign',
      },
      referralCode: String,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);

