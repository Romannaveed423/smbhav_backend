import mongoose, { Schema, Document } from 'mongoose';

export interface ICACallback extends Document {
  id: string;
  callbackId: string;
  userId: mongoose.Types.ObjectId;
  phoneNumber: string;
  preferredTime: string;
  applicationId?: mongoose.Types.ObjectId;
  reason?: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  requestedAt: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CACallbackSchema = new Schema<ICACallback>(
  {
    callbackId: {
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
    phoneNumber: {
      type: String,
      required: true,
    },
    preferredTime: {
      type: String,
      required: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'CAApplication',
      index: true,
    },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    scheduledAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
CACallbackSchema.index({ userId: 1, status: 1 });

// Generate callbackId before saving
CACallbackSchema.pre('save', async function(next) {
  if (this.isNew && !this.callbackId) {
    const count = await mongoose.model('CACallback').countDocuments();
    this.callbackId = `CALLBACK${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const CACallback = mongoose.model<ICACallback>('CACallback', CACallbackSchema);

