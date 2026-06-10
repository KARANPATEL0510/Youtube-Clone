/**
 * OTP Utilities
 *
 * Generates, stores, and verifies 6-digit one-time passwords.
 * Delivery is handled by /api/send-otp (pluggable).
 */

export type OtpChannel = 'email' | 'phone';

/** Generate a cryptographically-random 6-digit OTP string. */
export function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Range 100000–999999
  const otp = 100000 + (array[0] % 900000);
  return String(otp);
}

/** Verify a user-submitted OTP against the stored one (constant-time-safe string compare). */
export function verifyOtp(submitted: string, stored: string): boolean {
  if (!submitted || !stored) return false;
  if (submitted.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < submitted.length; i++) {
    diff |= submitted.charCodeAt(i) ^ stored.charCodeAt(i);
  }
  return diff === 0;
}

interface SendOtpPayload {
  channel: OtpChannel;
  target: string; // email address or phone number
  otp: string;
}

/**
 * Send OTP via the Next.js API route.
 *
 * In development / placeholder mode the API route logs to console.
 * Replace the API route body with real Nodemailer / Twilio logic for production.
 */
export async function sendOtp(payload: SendOtpPayload): Promise<void> {
  const res = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `OTP send failed (${res.status})`
    );
  }
}

/** Convenience wrapper — send OTP to email. */
export async function sendOtpToEmail(email: string, otp: string) {
  return sendOtp({ channel: 'email', target: email, otp });
}

/** Convenience wrapper — send OTP to phone number. */
export async function sendOtpToPhone(phone: string, otp: string) {
  return sendOtp({ channel: 'phone', target: phone, otp });
}

/** OTP expiry duration in milliseconds (default: 5 minutes). */
export const OTP_EXPIRY_MS = 5 * 60 * 1000;
