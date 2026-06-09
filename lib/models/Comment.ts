import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  videoId: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  likes: number;
  likedBy: string[];
  dislikes: number;
  dislikedBy: string[];
  userCity: string;
  parentId: string | null; // null = top-level, otherwise reply to this commentId
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema(
  {
    videoId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [String],
      default: [],
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    dislikedBy: {
      type: [String],
      default: [],
    },
    userCity: {
      type: String,
      default: '',
    },
    parentId: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export const Comment =
  mongoose.models.Comment ||
  mongoose.model<IComment>('Comment', CommentSchema);
