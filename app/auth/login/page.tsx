'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import '../signup/onboarding.css';

// ── LunaMark icon ──
const LunaMark = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path
      d="M15.5 3.5a9 9 0 1 0 5 5 7 7 0 0 1-5-5z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);

function LunaChip({ line }: { line: string }) {
  return (
    <div className="luna-line-wrap">
      <span className="luna-mark"><LunaMark size={13} /></span>
      <span className="luna-line">{line}</span>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Google OAuth ──────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  // ── Email + password login ────────────────────────────────────────────────────
  // Strategy: try Supabase signInWithPassword first (new accounts).
  // If Supabase returns "Invalid login credentials" and the user might be a legacy
  // account (email not in auth.users), fall back to our custom /auth/login endpoint.
  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      // ── Attempt 1: Supabase Auth (new Supabase-managed accounts) ─────────────
      const { data: { session }, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (session) {
        // Supabase login succeeded — no legacy token needed; apiRequest picks up the session
        if (session.user) {
          localStorage.setItem('user_info', JSON.stringify({ email: session.user.email }));
        }
        setTimeout(() => router.push(redirectTo), 500);
        return;
      }

      const isCredentialError =
        supabaseError?.message?.toLowerCase().includes('invalid login credentials') ||
        supabaseError?.message?.toLowerCase().includes('email not confirmed');

      if (!isCredentialError) {
        // Supabase returned a real error (rate limit, network, etc.) — surface it
        setError(supabaseError?.message || 'Login failed. Please try again.');
        return;
      }

      // ── Attempt 2: Legacy /auth/login (existing accounts with bcrypt passwords) ─
      const response = await login(formData);
      if (response.user) {
        localStorage.setItem('user_info', JSON.stringify(response.user));
      } else {
        localStorage.setItem('user_info', JSON.stringify({ email: formData.email, first_name: 'User', last_name: '' }));
      }
      setTimeout(() => router.push(redirectTo), 500);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="luna-onboard-root">
      <div className="luna-onboard-bg">
        <div className="luna-onboard-glow glow-1" />
        <div className="luna-onboard-glow glow-2" />
      </div>

      <div className="luna-onboard-stage-outer">
        <div className="luna-onboard-card">
          <div className="ob-shell">

            {/* Top bar */}
            <div className="ob-progress-bar">
              <div className="ob-progress-meta">
                <Link href="/" className="ob-brand" style={{ textDecoration: 'none' }}>
                  <span className="ob-brand-mark">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M15.5 3.5a9 9 0 1 0 5 5 7 7 0 0 1-5-5z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5, marginRight: 2 }}>
                    <path d="M19 12H5M11 6l-6 6 6 6" />
                  </svg>
                  Krew
                </Link>
              </div>
            </div>

            {/* Main content */}
            <div className="ob-stage">
              <div className="ob-stage-inner">
                <LunaChip line="Welcome back — pick up right where you left off." />

                <div className="form-screen" style={{ gap: 20 }}>
                  <div className="form-head">
                    <h2 className="form-title ds-h1-mixed">
                      <span className="emph">Log in</span>{' '}
                      <span className="rest">to your account.</span>
                    </h2>
                    <p className="ds-body form-sub">
                      Don&apos;t have an account?{' '}
                      <Link href="/auth/signup" style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}>
                        Sign up free
                      </Link>
                    </p>
                  </div>

                  {/* Google SSO */}
                  <div className="sso-row">
                    <button
                      type="button"
                      className="sso-btn"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="sso-icon">
                        <path d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.3-.9 2.3-2 3v2.5h3.2c1.9-1.7 3.1-4.3 3.1-7.3z" fill="currentColor" opacity="0.9" />
                        <path d="M12 22c2.7 0 5-.9 6.7-2.5l-3.2-2.5c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.6C4.6 19.7 8 22 12 22z" fill="currentColor" opacity="0.7" />
                        <path d="M6.2 13.7c-.2-.6-.3-1.2-.3-1.7s.1-1.1.3-1.7V7.7H2.9C2.3 9 2 10.4 2 12s.3 3 .9 4.3l3.3-2.6z" fill="currentColor" opacity="0.5" />
                        <path d="M12 5.8c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 2.9 14.7 2 12 2 8 2 4.6 4.3 2.9 7.7L6.2 10.3c.8-2.5 3.1-4.5 5.8-4.5z" fill="currentColor" opacity="0.85" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </div>
                  <div className="or-divider">or</div>

                  <form
                    id="login-form"
                    onSubmit={handleLogin}
                    className="form-fields"
                  >
                    <div className="field">
                      <label className="field-lbl">Work email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="field-input"
                        placeholder="you@company.com"
                        autoComplete="email"
                      />
                    </div>

                    <div className="field">
                      <label className="field-lbl">Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className="field-input"
                          placeholder="Your password"
                          style={{ paddingRight: '42px' }}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          style={{
                            position: 'absolute',
                            right: '13px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p style={{ color: '#f87171', fontSize: '0.72rem', margin: 0, textAlign: 'left' }}>
                        {error}
                      </p>
                    )}
                  </form>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="ob-footer">
              <span />
              <button
                type="submit"
                form="login-form"
                className="ob-btn-primary"
                disabled={loading}
              >
                {loading ? 'Logging in…' : 'Log in'}
                {!loading && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
