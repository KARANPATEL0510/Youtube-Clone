import { NextRequest, NextResponse } from 'next/server';
import { storeOtpInDb } from '@/lib/db/otps';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function generateOtpCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return String(code);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target } = body as { target: string };

    if (!target) {
      return NextResponse.json(
        { error: 'Missing phone number (target)' },
        { status: 400 }
      );
    }

    const otp = generateOtpCode();

    // Store in Firestore
    await storeOtpInDb(target, otp, OTP_EXPIRY_MS);

    // LOG TO THE TERMINAL CONSOLE FOR DEVELOPMENT
    console.log('\n========================================');
    console.log('📱 [DEVELOPMENT SMS OTP]');
    console.log(`Target Phone: ${target}`);
    console.log(`Verification Code: ${otp}`);
    console.log('========================================\n');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error generating and logging OTP:', error);
    return NextResponse.json(
      { error: 'Failed to generate OTP' },
      { status: 500 }
    );
  }
}
