import mongoose, { Schema, Document } from 'mongoose';

export interface IUserUpload extends Document {
  userId: string;
  channelId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  duration?: number;
  views: number;
  likes: number;
  comments: number;
  visibility: 'public' | 'private' | 'unlisted';
  isPremiumContent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserUploadSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  channelId: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  videoUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  duration: {
    type: Number,
    default: null,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public',
  },
  isPremiumContent: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const UserUpload = mongoose.models.UserUpload || mongoose.model<IUserUpload>('UserUpload', UserUploadSchema);
