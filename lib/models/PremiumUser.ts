import mongoose, { Schema, Document } from 'mongoose';

export interface IPremiumUser extends Document {
  userId: string;
  isPremium: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  activatedAt?: Date;
  expiresAt?: Date;
}

const PremiumUserSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  isPremium: { type: Boolean, default: false },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  activatedAt: { type: Date },
  expiresAt: { type: Date },
});

export const PremiumUser =
  mongoose.models.PremiumUser ||
  mongoose.model<IPremiumUser>('PremiumUser', PremiumUserSchema);
