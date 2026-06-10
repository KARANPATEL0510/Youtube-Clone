import mongoose, { Schema, Document } from 'mongoose';

export interface IFileUpload extends Document {
  userId: string; // Firebase UID
  fileName: string;
  fileType: 'video' | 'thumbnail';
  mimeType: string;
  size: number;
  data: string; // Base64 encoded file data
  uploadedAt: Date;
}

const FileUploadSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['video', 'thumbnail'],
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  data: {
    type: String, // Base64 encoded
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Add TTL index to automatically delete files after 30 days if not referenced
FileUploadSchema.index({ uploadedAt: 1 }, { expireAfterSeconds: 2592000 });

export const FileUpload = mongoose.models.FileUpload || mongoose.model('FileUpload', FileUploadSchema);
