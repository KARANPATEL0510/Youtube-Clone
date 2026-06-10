'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '@/lib/db/auth';
import { createUserProfile } from '@/lib/db/users';
import { useThemeLocation } from '@/lib/contexts/theme-location-context';

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

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const { theme, isSouthIndia, locationLoading, detectedState } = useThemeLocation();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (phone && !/^\+?[0-9\s\-()]{7,15}$/.test(phone)) {
      setError('Please enter a valid phone number (e.g. +91 98765 43210).');
      return;
    }

    setLoading(true);
    try {
      // Register with Firebase Auth
      const user = await registerUser(email, password);

      // Create Firestore profile (with optional phone)
      await createUserProfile(user.uid, email, displayName, undefined, phone || undefined);

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Styles ────────────────────────────────────────────────────────────────

  const isDark = theme === 'dark';
  const pageClass = isDark
    ? 'min-h-screen flex items-center justify-center bg-[oklch(0.1_0_0)]'
    : 'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-100 to-amber-50';

  const inputClass = `auth-input w-full px-4 py-3 rounded-xl text-sm`;

  const btnPrimary = `w-full py-3 rounded-xl font-semibold text-sm text-white
    bg-gradient-to-r from-red-600 to-rose-500
    hover:from-red-700 hover:to-rose-600
    active:scale-[0.98] transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className={pageClass}>
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.577 0.245 27.325), transparent)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.577 0.245 27.325), transparent)' }}
        />
      </div>

      <div className="auth-card w-full max-w-md rounded-2xl shadow-2xl p-8 relative overflow-hidden step-enter-right">
        {/* Top bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, oklch(0.577 0.245 27.325), oklch(0.65 0.2 15))' }}
        />

        {/* Header */}
        <div className="flex flex-col items-center mb-7">
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

          <h1 className="text-2xl font-bold mt-3">Create your account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Join YouTube Clone today
          </p>
        </div>

        {/* Error banner */}
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

        <form onSubmit={handleSignup} className="space-y-4" noValidate>
          {/* Display name */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="signup-name">
              Display Name <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                <UserIcon />
              </span>
              <input
                id="signup-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`${inputClass} pl-11`}
                placeholder="Your name"
                autoComplete="name"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="signup-email">
              Email address <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                <MailIcon />
              </span>
              <input
                id="signup-email"
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

          {/* Phone number */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="signup-phone">
              Phone number
              <span
                className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                for SMS OTP
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                <PhoneIcon />
              </span>
              <input
                id="signup-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${inputClass} pl-11`}
                placeholder="+91 98765 43210"
                autoComplete="tel"
                disabled={loading}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Required for users outside South India to receive OTP via SMS.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="signup-password">
              Password <span style={{ color: 'oklch(0.577 0.245 27.325)' }}>*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                <LockIcon />
              </span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pl-11 pr-11`}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
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

            {/* Password strength bar */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{
                        background:
                          passwordStrength(password) >= level
                            ? level === 1
                              ? 'oklch(0.577 0.245 27.325)'
                              : level === 2
                              ? 'oklch(0.75 0.18 85)'
                              : 'oklch(0.6 0.18 145)'
                            : 'var(--border)',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Strength: {['', 'Weak', 'Fair', 'Strong'][passwordStrength(password)]}
                </p>
              </div>
            )}
          </div>

          {/* OTP info notice */}
          {!locationLoading && (
            <div
              className="flex items-start gap-3 text-xs px-3 py-2.5 rounded-lg"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              <span className="mt-0.5">{isSouthIndia ? '📧' : '📱'}</span>
              <span>
                {isSouthIndia
                  ? 'Since you\\'re in South India, your OTP will be sent to your email after each login.'
                  : 'Since you\\'re outside South India, your OTP will be sent via SMS — please add your phone number above.'}
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
                Creating account…
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-red-500 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

// ── Password strength helper ──────────────────────────────────────────────────

function passwordStrength(password: string): 1 | 2 | 3 {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) && password.length >= 10) score++;
  return (Math.max(1, Math.min(3, score + 1)) as 1 | 2 | 3);
}
