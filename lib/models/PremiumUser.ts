import mongoose, { Schema, Document } from 'mongoose';

export interface IPremiumUser extends Document {
  userId: string;
  isPremium: boolean;
  plan?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  activatedAt?: Date;
  expiresAt?: Date;
}

const PremiumUserSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  isPremium: { type: Boolean, default: false },
  plan: { type: String, enum: ['free', 'bronze', 'silver', 'gold'], default: 'free' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  activatedAt: { type: Date },
  expiresAt: { type: Date },
});

export const PremiumUser =
  mongoose.models.PremiumUser ||
  mongoose.model<IPremiumUser>('PremiumUser', PremiumUserSchema);
