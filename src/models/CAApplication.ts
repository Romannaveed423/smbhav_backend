import mongoose, { Schema, Document } from 'mongoose';

export interface ICAApplication extends Document {
  id: string;
  applicationId: string; // Display ID like "APP001"
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  serviceType: string; // gst_registration, company_registration, etc.
  status: 'pending' | 'in_review' | 'awaiting_clarification' | 'approved' | 'rejected' | 'completed';
  clientDetails: {
    clientName: string;
    businessName: string;
    gstin?: string;
    addressProof?: string;
  };
  documents: {
    aadhar?: string;
    pan?: string;
    addressProof?: string;
    [key: string]: string | undefined;
  };
  additionalInfo?: {
    businessType?: string;
    turnover?: number;
    notes?: string;
    [key: string]: any;
  };
  timeline: Array<{
    title: string;
    time: string;
    status: 'completed' | 'current' | 'pending';
    icon?: string;
    timestamp?: Date;
    description?: string;
  }>;

  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;

  certificateNumber?: string;
  downloadUrl?: string;
  issuedAt?: Date;

  clarification?: {
    message: string;
    requiredDocuments: string[];
    deadline?: Date;
    requestedAt: Date;
    requestedBy: mongoose.Types.ObjectId;
  };

  price: number;
  expertId?: mongoose.Types.ObjectId; // Assigned CA expert
  submittedAt: Date;
  updatedAt: Date;
}

const CAApplicationSchema = new Schema<ICAApplication>(
  {
    applicationId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'CAService',
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

  reviewedAt: {
    type: Date,
  },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'awaiting_clarification', 'approved', 'rejected', 'completed'],
      default: 'pending',
      index: true,
    },
    clientDetails: {
      clientName: {
        type: String,
        required: true,
      },
      businessName: {
        type: String,
        required: true,
      },
      gstin: String,
      addressProof: String,
    },
    documents: {
      type: Schema.Types.Mixed,
      default: {},
    },
    additionalInfo: {
      type: Schema.Types.Mixed,
    },
    timeline: [
      {
        title: String,
        time: String,
        status: {
          type: String,
          enum: ['completed', 'current', 'pending'],
        },
        icon: String,
        timestamp: Date,
        description: String,
      },
    ],
    certificateNumber: String,
    downloadUrl: String,
    issuedAt: Date,
    price: {
      type: Number,
      required: true,
    },

    clarification: {
    message: String,
    requiredDocuments: [String],
    deadline: Date,
    requestedAt: Date,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  
    expertId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // CA expert user
    },
    
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
CAApplicationSchema.index({ userId: 1, status: 1 });
CAApplicationSchema.index({ serviceType: 1, status: 1 });
CAApplicationSchema.index({ expertId: 1, status: 1 });

// Generate applicationId before saving
CAApplicationSchema.pre('save', async function(next) {
  if (this.isNew && !this.applicationId) {
    const count = await mongoose.model('CAApplication').countDocuments();
    this.applicationId = `APP${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const CAApplication = mongoose.model<ICAApplication>('CAApplication', CAApplicationSchema);

