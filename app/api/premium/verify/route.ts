import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import { PremiumUser } from '@/lib/models/PremiumUser';

// POST /api/premium/verify — verify Razorpay payment and activate premium
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      isMock,
    } = await req.json();

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    await connectDB();

    if (!isMock) {
      // Verify signature
      const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
      if (!RAZORPAY_KEY_SECRET) {
        return NextResponse.json({ error: 'Server config error' }, { status: 500 });
      }

      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // Activate premium (lifetime for now)
    await PremiumUser.findOneAndUpdate(
      { userId },
      {
        userId,
        isPremium: true,
        razorpayOrderId: razorpay_order_id || 'mock',
        razorpayPaymentId: razorpay_payment_id || 'mock',
        activatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, isPremium: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
