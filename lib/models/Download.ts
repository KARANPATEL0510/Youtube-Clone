import mongoose, { Schema, Document } from 'mongoose';

export interface IDownload extends Document {
  userId: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl: string;
  channelName: string;
  downloadedAt: Date;
}

const DownloadSchema = new Schema({
  userId: { type: String, required: true, index: true },
  videoId: { type: String, required: true },
  videoTitle: { type: String, required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  channelName: { type: String, default: '' },
  downloadedAt: { type: Date, default: Date.now, index: true },
});

export const Download =
  mongoose.models.Download || mongoose.model<IDownload>('Download', DownloadSchema);
