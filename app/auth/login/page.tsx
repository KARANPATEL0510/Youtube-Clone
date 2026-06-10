'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '@/lib/db/auth';
import { getUserProfile } from '@/lib/db/users';
import { useThemeLocation } from '@/lib/contexts/theme-location-context';
import {
  generateOtp,
  sendOtpToEmail,
  sendOtpToPhone,
  verifyOtp,
  OTP_EXPIRY_MS,
} from '@/lib/otp-utils';
import { auth } from '@/lib/firebase';

// ─── Icons ────────────────────────────────────────────────────────────────────

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.12 6.12l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = ({ show }: { show: boolean }) =>
  show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

const MapPinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'credentials' | 'otp';

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { theme, isSouthIndia, locationLoading, detectedState } = useThemeLocation();

  // Step 1 state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 state
  const [step, setStep] = useState<Step>('credentials');
  const [otpValue, setOtpValue] = useState('');
  const [storedOtp, setStoredOtp] = useState('');
  const [otpChannel, setOtpChannel] = useState<'email' | 'phone'>('email');
  const [otpTarget, setOtpTarget] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Countdown timer
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Start countdown when OTP is sent
  useEffect(() => {
    if (!otpSent) return;
    setSecondsLeft(Math.ceil(OTP_EXPIRY_MS / 1000));
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [otpSent]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 350);
    }
  }, [step]);

  // ── Step 1: credentials ─────────────────────────────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      // Authenticate with Firebase
      const fbUser = await loginUser(email, password);

      // Determine OTP channel
      const channel = isSouthIndia ? 'email' : 'phone';
      setOtpChannel(channel);

      let target = '';
      if (channel === 'email') {
        target = fbUser.email || email;
      } else {
        // Fetch phone from Firestore profile
        const profile = await getUserProfile(fbUser.uid);
        target = profile?.phone || '';
        if (!target) {
          throw new Error(
            'No phone number found on your account. Please update your profile or contact support.'
          );
        }
      }
      setOtpTarget(target);

      // Generate & send OTP
      const otp = generateOtp();
      setStoredOtp(otp);
      setOtpExpiresAt(Date.now() + OTP_EXPIRY_MS);

      if (channel === 'email') {
        await sendOtpToEmail(target, otp);
      } else {
        await sendOtpToPhone(target, otp);
      }

      setOtpSent(true);
      setSuccess(
        channel === 'email'
          ? `OTP sent to your email: ${maskEmail(target)}`
          : `OTP sent to your phone: ${maskPhone(target)}`
      );
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OTP verification ────────────────────────────────────────────────
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpValue || otpValue.length < 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    if (Date.now() > otpExpiresAt) {
      setError('OTP has expired. Please go back and try again.');
      return;
    }

    setLoading(true);
    try {
      const valid = verifyOtp(otpValue.trim(), storedOtp);
      if (!valid) throw new Error('Invalid OTP. Please check and try again.');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setError(null);
    setOtpValue('');
    const otp = generateOtp();
    setStoredOtp(otp);
    setOtpExpiresAt(Date.now() + OTP_EXPIRY_MS);
    try {
      if (otpChannel === 'email') {
        await sendOtpToEmail(otpTarget, otp);
      } else {
        await sendOtpToPhone(otpTarget, otp);
      }
      setOtpSent((v) => !v); // toggle to restart effect
      setTimeout(() => setOtpSent(true), 50);
      setSuccess('A new OTP has been sent.');
    } catch {
      setError('Failed to resend OTP. Please try again.');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isDark = theme === 'dark';
  const pageClass = isDark
    ? 'min-h-screen flex items-center justify-center bg-[oklch(0.1_0_0)]'
    : 'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-100 to-amber-50';

  const cardClass = `auth-card w-full max-w-md rounded-2xl shadow-2xl p-8 relative overflow-hidden`;

  const inputClass = `auth-input w-full px-4 py-3 rounded-xl text-sm`;

  const btnPrimary = `w-full py-3 rounded-xl font-semibold text-sm text-white
    bg-gradient-to-r from-red-600 to-rose-500
    hover:from-red-700 hover:to-rose-600
    active:scale-[0.98] transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed`;

  const btnGhost = `text-sm font-medium text-red-500 hover:underline disabled:opacity-40`;

  const stepClass = step === 'credentials' ? 'step-enter-left' : 'step-enter-right';

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className={pageClass}>
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.577 0.245 27.325), transparent)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.577 0.245 27.325), transparent)' }}
        />
      </div>

      <div className={cardClass}>
        {/* Decorative top bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, oklch(0.577 0.245 27.325), oklch(0.65 0.2 15))' }}
        />

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-5">
            <YouTubeIcon />
            <span className="text-xl font-bold tracking-tight">YouTube Clone</span>
          </div>

          {/* Context badges */}
          <div className="flex flex-wrap gap-2 justify-center mb-2">
            {locationLoading ? (
              <span className="theme-badge" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                ⟳ Detecting location…
              </span>
            ) : (
              <>
                <span className={`theme-badge ${isDark ? 'theme-badge-dark' : 'theme-badge-light'}`}>
                  {isDark ? <MoonIcon /> : <SunIcon />}
                  {isDark ? 'Dark Theme' : 'Light Theme'}
                </span>
                {detectedState && (
                  <span className="theme-badge" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
                    <MapPinIcon />
                    {detectedState}
                  </span>
                )}
              </>
            )}
          </div>

          <h1 className="text-2xl font-bold mt-3">
            {step === 'credentials' ? 'Welcome back' : 'Verify your identity'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {step === 'credentials'
              ? 'Sign in to continue to YouTube Clone'
              : isSouthIndia
              ? '📧 Check your email for the OTP'
              : '📱 Check your phone for the OTP'}
          </p>
        </div>

        {/* Error / success banners */}
        {error && (
          <div
            className="flex items-start gap-2 text-sm px-4 py-3 rounded-xl mb-4"
            style={{ background: 'oklch(0.95 0.05 27)', color: 'oklch(0.45 0.2 27)', border: '1px solid oklch(0.85 0.1 27)' }}
            role="alert"
          >
            <span className="mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}
        {success && step === 'otp' && (
          <div
            className="flex items-start gap-2 text-sm px-4 py-3 rounded-xl mb-4"
            style={{ background: 'oklch(0.95 0.05 145)', color: 'oklch(0.4 0.15 145)', border: '1px solid oklch(0.85 0.08 145)' }}
          >
            <span className="mt-0.5">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* ── Step 1: Credentials ─────────────────────────────────────────── */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentials} className={`space-y-5 ${stepClass}`} noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="login-email">
                Email address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                  <MailIcon />
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} pl-11`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                  <LockIcon />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pl-11 pr-11`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--muted-foreground)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon show={showPassword} />
                </button>
              </div>
            </div>

            {/* OTP info callout */}
            {!locationLoading && (
              <div
                className="flex items-start gap-3 text-xs px-3 py-2.5 rounded-lg"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                {isSouthIndia ? <MailIcon /> : <PhoneIcon />}
                <span>
                  {isSouthIndia
                    ? 'As you\\'re in South India, an OTP will be sent to your registered email.'
                    : 'An OTP will be sent to your registered mobile number after login.'}
                </span>
              </div>
            )}

            <button type="submit" className={btnPrimary} disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Continue'
              )}
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-red-500 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        )}

        {/* ── Step 2: OTP verification ────────────────────────────────────── */}
        {step === 'otp' && (
          <form onSubmit={handleOtpVerify} className={`space-y-5 ${stepClass}`} noValidate>
            {/* Channel info */}
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'oklch(0.577 0.245 27.325 / 15%)', color: 'oklch(0.577 0.245 27.325)' }}
              >
                {otpChannel === 'email' ? <MailIcon /> : <PhoneIcon />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                  {otpChannel === 'email' ? 'Email OTP' : 'SMS OTP'}
                </p>
                <p className="text-sm font-medium truncate max-w-[220px]">{otpTarget}</p>
              </div>
            </div>

            {/* OTP input */}
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="otp-input">
                Enter 6-digit OTP
              </label>
              <input
                id="otp-input"
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                className="otp-input w-full px-4 py-4"
                placeholder="000000"
                disabled={loading}
                autoComplete="one-time-code"
              />
            </div>

            {/* Timer */}
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--muted-foreground)' }}>
                {secondsLeft > 0 ? (
                  <>OTP expires in <span className="font-semibold tabular-nums">{formatTime(secondsLeft)}</span></>
                ) : (
                  <span className="text-red-400 font-medium">OTP expired</span>
                )}
              </span>
              <button
                type="button"
                className={btnGhost}
                onClick={handleResend}
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>

            {/* Step progress */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-1 rounded-full" style={{ background: 'oklch(0.577 0.245 27.325)' }}/>
              <div className="flex-1 h-1 rounded-full" style={{ background: 'oklch(0.577 0.245 27.325)' }}/>
            </div>

            <button type="submit" className={btnPrimary} disabled={loading || secondsLeft === 0}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Verifying…
                </span>
              ) : (
                'Verify & Sign In'
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(null); setOtpValue(''); }}
              className="w-full text-sm font-medium py-2 rounded-xl transition-colors"
              style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
            >
              ← Back to login
            </button>
          </form>
        )}

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-6">
          {(['credentials', 'otp'] as Step[]).map((s) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: step === s ? '24px' : '8px',
                background: step === s
                  ? 'oklch(0.577 0.245 27.325)'
                  : 'var(--muted-foreground)',
                opacity: step === s ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  return `${user.slice(0, 2)}${'*'.repeat(Math.max(0, user.length - 2))}@${domain}`;
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
}
