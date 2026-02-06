import mongoose, { Schema, Document } from 'mongoose';

export interface ICAChat extends Document {
  id: string;
  chatId: string; // Display ID
  userId: mongoose.Types.ObjectId;
  expertId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  status: 'active' | 'closed' | 'resolved' | 'transferred';
  serviceType: 'ca_consultation' | 'tax_filing' | 'business_registration' | 'other';
  startedAt: Date;
  lastMessageAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CAChatSchema = new Schema<ICAChat>(
  {
    chatId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expertId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'CAApplication',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'resolved', 'transferred'],
      default: 'active',
      index: true,
    },
    serviceType: {
      type: String,
      enum: ['ca_consultation', 'tax_filing', 'business_registration', 'other'],
      default: 'ca_consultation',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
CAChatSchema.index({ userId: 1, status: 1 });
CAChatSchema.index({ expertId: 1, status: 1 });

// Generate chatId before saving
CAChatSchema.pre('save', async function(next) {
  if (this.isNew && !this.chatId) {
    const count = await mongoose.model('CAChat').countDocuments();
    this.chatId = `CHAT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const CAChat = mongoose.model<ICAChat>('CAChat', CAChatSchema);

