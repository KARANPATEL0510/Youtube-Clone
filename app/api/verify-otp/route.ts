import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpInDb } from '@/lib/db/otps';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, otp } = body as { target: string; otp: string };

    if (!target || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields: target, otp' },
        { status: 400 }
      );
    }

    const isValid = await verifyOtpInDb(target, otp.trim());

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
