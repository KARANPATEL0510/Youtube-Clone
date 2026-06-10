import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/send-otp
 *
 * Body: { channel: 'email' | 'phone', target: string, otp: string }
 *
 * PLACEHOLDER — logs to console in development.
 *
 * ─── To wire up a real provider ──────────────────────────────────────────────
 *
 *  EMAIL (e.g. Nodemailer + Gmail / SendGrid):
 *    const transporter = nodemailer.createTransport({ ... });
 *    await transporter.sendMail({
 *      from: 'noreply@yourdomain.com',
 *      to: target,
 *      subject: 'Your OTP Code',
 *      text: `Your one-time password is: ${otp}. It expires in 5 minutes.`,
 *    });
 *
 *  SMS (e.g. Twilio):
 *    const client = twilio(accountSid, authToken);
 *    await client.messages.create({
 *      body: `Your YouTube Clone OTP is: ${otp}`,
 *      from: '+1xxxxxxxxxx',
 *      to: target,
 *    });
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel, target, otp } = body as {
      channel: 'email' | 'phone';
      target: string;
      otp: string;
    };

    if (!channel || !target || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, target, otp' },
        { status: 400 }
      );
    }

    if (channel !== 'email' && channel !== 'phone') {
      return NextResponse.json(
        { error: 'Invalid channel. Must be "email" or "phone".' },
        { status: 400 }
      );
    }

    // ── PLACEHOLDER: log OTP so developers can test the flow ──────────────────
    console.log(
      `\n╔══════════════════════════════════════════╗`
    );
    console.log(`║  🔐 OTP DELIVERY (PLACEHOLDER MODE)      ║`);
    console.log(`║  Channel : ${channel.padEnd(30)}║`);
    console.log(`║  Target  : ${target.substring(0, 30).padEnd(30)}║`);
    console.log(`║  OTP     : ${otp.padEnd(30)}║`);
    console.log(`╚══════════════════════════════════════════╝\n`);

    // ── TODO: replace above with real delivery logic ───────────────────────────

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-otp] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
