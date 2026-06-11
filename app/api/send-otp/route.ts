import { NextRequest, NextResponse } from 'next/server';
import { storeOtpInDb } from '@/lib/db/otps';
import nodemailer from 'nodemailer';

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
        { error: 'Missing target email address' },
        { status: 400 }
      );
    }

    const otp = generateOtpCode();

    // Store in Firestore
    await storeOtpInDb(target, otp, OTP_EXPIRY_MS);

    // LOG TO THE TERMINAL CONSOLE FOR DEVELOPMENT
    console.log('\n========================================');
    console.log('📧 [DEVELOPMENT EMAIL OTP]');
    console.log(`Target Email: ${target}`);
    console.log(`Verification Code: ${otp}`);
    console.log('========================================\n');

    // Attempt to send via Nodemailer if SMTP env variables are configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost || 'smtp.gmail.com',
          port: parseInt(smtpPort || '587'),
          secure: smtpPort === '465',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: process.env.SMTP_FROM || `"YouTube Clone" <${smtpUser}>`,
          to: target,
          subject: 'YouTube Clone Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #ff0000; margin: 0; font-size: 28px;">YouTube Clone</h2>
              </div>
              <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
              <p style="font-size: 16px; color: #333;">Hello,</p>
              <p style="font-size: 16px; color: #333;">Your verification code for logging into YouTube Clone is:</p>
              <div style="background-color: #f9f9f9; border: 1px dashed #ccc; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111; margin: 25px 0; border-radius: 8px;">
                ${otp}
              </div>
              <p style="font-size: 14px; color: #555;">This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 25px; margin-bottom: 15px;" />
              <p style="font-size: 12px; color: #888; text-align: center; margin: 0;">© 2026 YouTube Clone. All rights reserved.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Successfully sent OTP email to ${target}`);
      } catch (smtpError) {
        console.error('[SMTP] Failed to send OTP email:', smtpError);
      }
    } else {
      console.warn('[SMTP] Configuration missing. OTP email not sent. Check local console logs above.');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error generating and sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to generate OTP' },
      { status: 500 }
    );
  }
}
