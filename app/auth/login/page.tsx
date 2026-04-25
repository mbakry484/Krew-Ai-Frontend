'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
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

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
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
