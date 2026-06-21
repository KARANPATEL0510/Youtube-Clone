import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import { PremiumUser } from '@/lib/models/PremiumUser';
import nodemailer from 'nodemailer';

// POST /api/premium/verify — verify Razorpay payment and activate plan
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      email,
      plan,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      isMock,
    } = await req.json();

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const selectedPlan = plan || 'gold';

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

    // Activate plan in database
    await PremiumUser.findOneAndUpdate(
      { userId },
      {
        userId,
        isPremium: true,
        plan: selectedPlan,
        razorpayOrderId: razorpay_order_id || 'mock',
        razorpayPaymentId: razorpay_payment_id || 'mock',
        activatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Send Invoice Email via Nodemailer if SMTP is configured and user email exists
    if (email) {
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          const planPrices: Record<string, number> = { bronze: 10, silver: 50, gold: 100 };
          const limitMap: Record<string, string> = { bronze: '7 minutes', silver: '10 minutes', gold: 'unlimited access' };
          const price = planPrices[selectedPlan] || 100;
          const limitText = limitMap[selectedPlan] || 'unlimited access';

          const mailOptions = {
            from: process.env.SMTP_FROM || `"YouTube Clone Payments" <${smtpUser}>`,
            to: email,
            subject: `YouTube Clone Invoice - ${selectedPlan.toUpperCase()} Plan Subscription`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h1 style="color: #ff0000; margin: 0; font-size: 28px;">YouTube Clone Invoice</h1>
                  <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Thank you for your purchase!</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
                
                <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; font-size: 16px;">Order Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 25px;">
                  <tr>
                    <td style="padding: 6px 0; color: #666;">Plan Purchased:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #111; text-transform: capitalize;">${selectedPlan} Plan</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666;">Payment ID:</td>
                    <td style="padding: 6px 0; text-align: right; color: #111; font-family: monospace;">${razorpay_payment_id || 'mock_pay_id'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666;">Order ID:</td>
                    <td style="padding: 6px 0; text-align: right; color: #111; font-family: monospace;">${razorpay_order_id || 'mock_ord_id'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666;">Date:</td>
                    <td style="padding: 6px 0; text-align: right; color: #111;">${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr style="border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
                    <td style="padding: 10px 0; font-weight: bold; color: #111; font-size: 16px;">Total Paid:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #ff0000; font-size: 16px;">₹${price}</td>
                  </tr>
                </table>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; font-size: 14px; color: #555; margin-bottom: 25px;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; color: #333;">What's next?</p>
                  <p style="margin: 0;">Your plan has been activated immediately. You can now enjoy video playback up to <strong>${limitText}</strong> and all other premium features!</p>
                </div>
                
                <p style="font-size: 12px; color: #888; text-align: center; margin: 0;">© 2026 YouTube Clone. All rights reserved.</p>
              </div>
            `,
          };

          await transporter.sendMail(mailOptions);
          console.log(`[SMTP Invoice] Successfully sent to ${email}`);
        } catch (smtpErr) {
          console.error('[SMTP Invoice] Failed to send email invoice:', smtpErr);
        }
      } else {
        console.warn('[SMTP Invoice] Credentials missing, skipping invoice email sending.');
      }
    }

    return NextResponse.json({ success: true, isPremium: true, plan: selectedPlan });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
