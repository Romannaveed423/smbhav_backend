import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
LocationSchema.index({ userId: 1, isDefault: 1 });
LocationSchema.index({ userId: 1 });

// Ensure only one default location per user
LocationSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await mongoose.model('Location').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export const Location = mongoose.model<ILocation>('Location', LocationSchema);

