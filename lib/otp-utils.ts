/**
 * OTP Client Utilities
 */

export async function sendOtp(target: string): Promise<void> {
  const res = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `OTP send failed (${res.status})`
    );
  }
}

export async function verifyOtpOnServer(target: string, otp: string): Promise<boolean> {
  const res = await fetch('/api/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, otp }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `OTP verification failed (${res.status})`
    );
  }

  const data = await res.json();
  return data.success;
}
