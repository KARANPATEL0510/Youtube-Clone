import mongoose, { Schema, Document } from 'mongoose';

export interface IChannel extends Document {
  userId: string; // Firebase UID
  channelName: string;
  description: string;
  profileImage?: string;
  bannerImage?: string;
  subscriberCount: number;
  subscribers: string[]; // Array of user IDs
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  channelName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  profileImage: {
    type: String,
    default: null,
  },
  bannerImage: {
    type: String,
    default: null,
  },
  subscriberCount: {
    type: Number,
    default: 0,
  },
  subscribers: {
    type: [String],
    default: [],
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

export const Channel = mongoose.models.Channel || mongoose.model<IChannel>('Channel', ChannelSchema);
