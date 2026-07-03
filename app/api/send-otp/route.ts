import { NextRequest, NextResponse } from 'next/server';
import { storeOtpInDb } from '@/lib/db/otps';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function generateOtpCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return String(code);
}

/** True when target looks like an email address */
function isEmail(target: string): boolean {
  return target.includes('@');
}

/** True when target looks like a phone number (digits, spaces, +, -, parens) */
function isPhone(target: string): boolean {
  return /^[\+\d][\d\s\-().]{5,}$/.test(target.trim());
}

// Build HTML email body
function buildHtmlEmail(otp: string, purpose: string, senderName: string): string {
  const isFriendRequest = purpose === 'friend-request';

  const bodyHeading = isFriendRequest
    ? `<p style="font-size:16px;color:#333;"><strong>${senderName || 'A user'}</strong> sent you a friend request on YouTube Clone!</p>
       <p style="font-size:15px;color:#555;">Share this OTP with them so they can complete the request:</p>`
    : `<p style="font-size:16px;color:#333;">Your verification code for YouTube Clone is:</p>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;background:#ffffff;">
      <div style="text-align:center;padding-bottom:16px;border-bottom:1px solid #f0f0f0;">
        <h2 style="color:#ff0000;margin:0;font-size:26px;letter-spacing:-0.5px;">▶ YouTube Clone</h2>
      </div>
      <div style="padding:24px 0;">
        <p style="font-size:16px;color:#333;margin:0 0 12px;">Hello,</p>
        ${bodyHeading}
        <div style="background:#f8f8f8;border:2px dashed #ddd;padding:20px;text-align:center;font-size:36px;font-weight:bold;letter-spacing:8px;color:#111;margin:24px 0;border-radius:10px;">
          ${otp}
        </div>
        <p style="font-size:13px;color:#888;margin:0;">
          ⏱ This code expires in <strong>5 minutes</strong>.<br/>
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      <div style="border-top:1px solid #f0f0f0;padding-top:16px;text-align:center;">
        <p style="font-size:11px;color:#aaa;margin:0;">© 2026 YouTube Clone. All rights reserved.</p>
      </div>
    </div>
  `;
}

async function sendEmailViaSMTP(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `"YouTube Clone" <${smtpUser}>`;

  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP_USER and SMTP_PASS environment variables are not configured.');
  }

  // Dynamic import — required for nodemailer v8 (ESM) in serverless
  const { createTransport } = await import('nodemailer');

  const transporter = createTransport({
    host: smtpHost,
    port: smtpPort,
    // port 465 = SSL, port 587 = STARTTLS
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
    // Required for Gmail App Passwords in some serverless environments
    tls: { rejectUnauthorized: true },
    // Disable connection pool — critical for serverless functions
    pool: false,
    // Timeouts — keep under Vercel's 10s limit
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  } as any);

  try {
    const info = await transporter.sendMail({ from: smtpFrom, to, subject, html });
    console.log(`[SMTP] ✅ Email sent to ${to} — messageId: ${info.messageId}`);
  } finally {
    // Always close the connection — essential in serverless environments
    transporter.close();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      target,
      purpose = 'login',
      senderName = '',
    } = body as {
      target: string;
      purpose?: 'login' | 'friend-request';
      senderName?: string;
    };

    const cleanTarget = (target ?? '').toString().trim();

    if (!cleanTarget || (!isEmail(cleanTarget) && !isPhone(cleanTarget))) {
      return NextResponse.json(
        { error: 'Missing or invalid target. Must be an email address or phone number.' },
        { status: 400 }
      );
    }

    const otp = generateOtpCode();

    // Store OTP in Firestore (keyed by normalised target)
    await storeOtpInDb(cleanTarget.toLowerCase(), otp, OTP_EXPIRY_MS);

    console.log(`[OTP] Generated for ${cleanTarget} (purpose: ${purpose}) — code: ${otp}`);

    // ── Route by target type ──
    if (isEmail(cleanTarget)) {
      // Email path — send via SMTP
      const isFriendRequest = purpose === 'friend-request';
      const subject = isFriendRequest
        ? `${senderName || 'Someone'} wants to be your friend on YouTube Clone`
        : 'YouTube Clone — Your Verification Code';
      const html = buildHtmlEmail(otp, purpose, senderName);
      await sendEmailViaSMTP(cleanTarget.toLowerCase(), subject, html);
      console.log(`[OTP] ✅ Email OTP dispatched to ${cleanTarget}`);
    } else {
      // Phone / SMS path — OTP is stored; log it clearly for development.
      // In production, replace the block below with your SMS provider (Twilio, MSG91, etc.).
      console.log(`
┌────────────────────────────────────────────────────┐
│  📱 SMS OTP (Development Mode)                │
│  Target : ${cleanTarget.padEnd(38)}│
│  OTP    : ${otp.padEnd(38)}│
│  Expiry : 5 minutes                            │
│  Note   : Wire a real SMS provider (Twilio /   │
│           MSG91) in production.                │
└────────────────────────────────────────────────────┘`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    const message: string = error?.message || 'Unknown error';

    // Classify the error for the client
    if (
      message.includes('SMTP_USER') ||
      message.includes('SMTP_PASS') ||
      message.includes('environment variable')
    ) {
      console.error('[OTP] ❌ SMTP not configured:', message);
      return NextResponse.json(
        { error: 'Email service is not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    if (
      message.includes('Invalid login') ||
      message.includes('Username and Password') ||
      message.includes('535')
    ) {
      console.error('[OTP] ❌ Gmail authentication failed:', message);
      return NextResponse.json(
        { error: 'Email authentication failed. Check SMTP credentials.' },
        { status: 502 }
      );
    }

    if (message.includes('550') || message.includes('recipient')) {
      console.error('[OTP] ❌ Invalid recipient address:', message);
      return NextResponse.json(
        { error: 'Could not deliver email — recipient address may be invalid.' },
        { status: 400 }
      );
    }

    // Generic SMTP / DB failure
    console.error('[OTP] ❌ Failed to send OTP:', message);
    return NextResponse.json(
      { error: `Failed to send OTP: ${message}` },
      { status: 500 }
    );
  }
}
