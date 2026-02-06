import mongoose, { Schema, Document } from 'mongoose';

export interface ICAFormEntry extends Document {
  id: string;
  entryId: string; // Display ID like "ENTRY001"
  userId: mongoose.Types.ObjectId;
  subSubcategoryId: mongoose.Types.ObjectId; // Links to Sub-subcategory
  formSchemaId: mongoose.Types.ObjectId; // Links to Form Schema (for versioning)
  applicationId?: mongoose.Types.ObjectId; // Links to CA Application if submitted
  formData: Record<string, any>; // User-submitted data matching the schema
  files?: Record<string, string>; // File URLs for file-type fields
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId; // Admin/CA who reviewed
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CAFormEntrySchema = new Schema<ICAFormEntry>(
  {
    entryId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subSubcategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'CAServiceCategory',
      required: true,
      index: true,
    },
    formSchemaId: {
      type: Schema.Types.ObjectId,
      ref: 'CAFormSchema',
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'CAApplication',
    },
    formData: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    files: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'in_review', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
CAFormEntrySchema.index({ userId: 1, status: 1 });
CAFormEntrySchema.index({ subSubcategoryId: 1, status: 1 });
CAFormEntrySchema.index({ applicationId: 1 });

// Generate entryId before saving
CAFormEntrySchema.pre('save', async function(next) {
  if (this.isNew && !this.entryId) {
    const count = await mongoose.model('CAFormEntry').countDocuments();
    this.entryId = `ENTRY${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const CAFormEntry = mongoose.model<ICAFormEntry>('CAFormEntry', CAFormEntrySchema);

