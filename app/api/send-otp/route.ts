import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/send-otp
 *
 * Body: { channel: 'email' | 'phone', target: string, otp: string }
 *
 * Uses Twilio for SMS and Nodemailer (Gmail) for email delivery.
 *
 * Required env vars:
 *   SMS:   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *   Email: GMAIL_USER, GMAIL_APP_PASS
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

    if (channel === 'phone') {
      // ── SMS via Twilio ───────────────────────────────────────────────────────
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken  = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        console.error('[send-otp] Twilio env vars not configured');
        return NextResponse.json(
          { error: 'SMS service not configured. Please contact support.' },
          { status: 503 }
        );
      }

      const twilio = (await import('twilio')).default;
      const client = twilio(accountSid, authToken);

      await client.messages.create({
        body: `Your YouTube Clone OTP is: ${otp}. It expires in 5 minutes. Do not share this code.`,
        from: fromNumber,
        to: target,
      });

      console.log(`[send-otp] SMS OTP sent to ${target}`);

    } else if (channel === 'email') {
      // ── Email via Nodemailer (Gmail) ─────────────────────────────────────────
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_APP_PASS;

      if (!gmailUser || !gmailPass) {
        console.error('[send-otp] Gmail env vars not configured');
        return NextResponse.json(
          { error: 'Email service not configured. Please contact support.' },
          { status: 503 }
        );
      }

      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });

      await transporter.sendMail({
        from: `"YouTube Clone" <${gmailUser}>`,
        to: target,
        subject: 'Your OTP Code — YouTube Clone',
        html: `
          <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="color:#ef4444;margin:0 0 8px">YouTube Clone</h2>
            <p style="color:#374151;margin-bottom:16px">Your one-time password is:</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#111827;text-align:center;padding:16px;background:#f9fafb;border-radius:8px">
              ${otp}
            </div>
            <p style="color:#6b7280;font-size:13px;margin-top:16px">
              This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
            </p>
          </div>
        `,
      });

      console.log(`[send-otp] Email OTP sent to ${target}`);

    } else {
      return NextResponse.json(
        { error: 'Invalid channel. Must be "email" or "phone".' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-otp] Error:', err);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
