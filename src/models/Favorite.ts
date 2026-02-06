import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  type: 'store' | 'product';
  itemId: mongoose.Types.ObjectId;
  typeModel: 'Store' | 'StoreProduct';
  addedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['store', 'product'],
      required: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'typeModel',
    },
    typeModel: {
      type: String,
      enum: ['Store', 'StoreProduct'],
      required: true,
    },
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
FavoriteSchema.index({ userId: 1, type: 1 });
FavoriteSchema.index({ userId: 1, itemId: 1, type: 1 }, { unique: true }); // One favorite per item per user

// Set typeModel based on type
FavoriteSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.type === 'store') {
    doc.typeModel = 'Store';
  } else if (doc.type === 'product') {
    doc.typeModel = 'StoreProduct';
  }
  next();
});

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema);

