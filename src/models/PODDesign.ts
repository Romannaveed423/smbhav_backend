import mongoose, { Schema, Document } from 'mongoose';

export interface IPODDesign extends Document {
  id: string;
  designId: string;
  userId: mongoose.Types.ObjectId;
  designUrl: string;
  thumbnailUrl: string;
  fileName: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  designType: 'image' | 'text' | 'logo';
  validation: {
    isValid: boolean;
    minResolution: string;
    maxResolution: string;
    recommendedResolution: string;
  };
  status?: 'pending' | 'approved' | 'rejected';
  approvedDate?: Date;
  rejectedDate?: Date;
  rejectionReason?: string;
  approvedBy?: mongoose.Types.ObjectId;
  rejectedBy?: mongoose.Types.ObjectId;
  productType?: string; // "tshirt" | "cup" | "hoodie" | "phone_cover"
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PODDesignSchema = new Schema<IPODDesign>(
  {
    designId: {
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
    designUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: String,
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    dimensions: {
      width: Number,
      height: Number,
    },
    designType: {
      type: String,
      enum: ['image', 'text', 'logo'],
      default: 'image',
    },
    validation: {
      isValid: {
        type: Boolean,
        default: true,
      },
      minResolution: String,
      maxResolution: String,
      recommendedResolution: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    approvedDate: Date,
    rejectedDate: Date,
    rejectionReason: String,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    productType: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PODDesignSchema.index({ userId: 1 });
PODDesignSchema.index({ status: 1, createdAt: -1 });

// Generate designId before saving
PODDesignSchema.pre('save', async function(next) {
  if (this.isNew && !this.designId) {
    const count = await mongoose.model('PODDesign').countDocuments();
    this.designId = `DESIGN${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const PODDesign = mongoose.model<IPODDesign>('PODDesign', PODDesignSchema);

