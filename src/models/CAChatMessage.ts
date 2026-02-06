import mongoose, { Schema, Document } from 'mongoose';


export interface ICAChatMessage extends Document {
  id: string;
  messageId: string;
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: 'user' | 'expert' | 'admin';
  message: string;
  attachments?: string[]; // File URLs
  isRead: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new mongoose.Schema(
  {
    url: String,
    publicId: String,
    fileName: String,
    fileType: String,
    fileSize: Number,
  },
  { _id: false }
);

const CAChatMessageSchema = new Schema<ICAChatMessage>(
  {
    messageId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'CAChat',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderType: {
      type: String,
      enum: ['user', 'expert', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachments: [AttachmentSchema],
    isRead: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CAChatMessageSchema.index({ chatId: 1, timestamp: -1 });
CAChatMessageSchema.index({ senderId: 1, isRead: 1 });

// Generate messageId before saving
CAChatMessageSchema.pre('save', async function(next) {
  if (this.isNew && !this.messageId) {
    const count = await mongoose.model('CAChatMessage').countDocuments();
    this.messageId = `MSG${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const CAChatMessage = mongoose.model<ICAChatMessage>('CAChatMessage', CAChatMessageSchema);

