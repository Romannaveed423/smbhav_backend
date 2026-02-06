import mongoose, { Schema, Document } from 'mongoose';

export interface ICAFormSchema extends Document {
  id: string;
  subSubcategoryId: mongoose.Types.ObjectId; // Links to Sub-subcategory
  fields: Array<{
    name: string; // Field identifier (e.g., "businessName", "gstin")
    label: string; // Display label (e.g., "Business Name", "GSTIN")
    type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox';
    placeholder?: string;
    isRequired: boolean;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string; // Regex pattern
      minLength?: number;
      maxLength?: number;
    };
    options?: Array<{ // For select/checkbox types
      value: string;
      label: string;
    }>;
    defaultValue?: string | number | boolean;
    helpText?: string; // Helper text shown below field
    section?: string; // Group fields into sections
    order: number; // Display order
  }>;
  sections?: Array<{ // Optional: Group fields into sections
    id: string;
    title: string;
    description?: string;
    order: number;
  }>;
  isActive: boolean;
  version: number; // For schema versioning
  createdBy?: mongoose.Types.ObjectId; // Admin who created it
  createdAt: Date;
  updatedAt: Date;
}

const CAFormSchemaSchema = new Schema<ICAFormSchema>(
  {
    subSubcategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'CAServiceCategory',
      required: true,
      unique: true, // One schema per sub-subcategory
      index: true,
    },
    fields: [
      {
        name: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['text', 'email', 'phone', 'number', 'date', 'select', 'textarea', 'file', 'checkbox'],
          required: true,
        },
        placeholder: String,
        isRequired: {
          type: Boolean,
          default: false,
        },
        validation: {
          min: Number,
          max: Number,
          pattern: String,
          minLength: Number,
          maxLength: Number,
        },
        options: [
          {
            value: String,
            label: String,
          },
        ],
        defaultValue: Schema.Types.Mixed,
        helpText: String,
        section: String,
        order: {
          type: Number,
          required: true,
        },
      },
    ],
    sections: [
      {
        id: String,
        title: String,
        description: String,
        order: Number,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CAFormSchemaSchema.index({ subSubcategoryId: 1, isActive: 1 });

export const CAFormSchema = mongoose.model<ICAFormSchema>('CAFormSchema', CAFormSchemaSchema);

