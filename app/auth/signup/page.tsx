'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup } from '@/lib/api';

// =============================================================================
// AURA CUSTOMIZATION — edit the values below to change the animated left panel
// =============================================================================
const AURA = {
  // Base background of the left panel
  baseBg: '#0a1628',

  // Each blob: color (as rgba), size (px), start position (%), animation duration (s)
  blobs: [
    { color: 'rgba(30, 80, 220, 0.55)',  size: 420, top: '30%', left: '20%', duration: 8,  delay: 0   },
    { color: 'rgba(60, 120, 255, 0.35)', size: 320, top: '60%', left: '55%', duration: 11, delay: 2   },
    { color: 'rgba(100,170,255, 0.20)',  size: 260, top: '10%', left: '60%', duration: 9,  delay: 4   },
    { color: 'rgba(20,  50, 180, 0.45)', size: 360, top: '70%', left: '5%',  duration: 13, delay: 1   },
  ],

  // How far each blob drifts in px (x, y)  — increase for more movement
  driftX: 60,
  driftY: 50,
};
// =============================================================================

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    phone_number: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(formData);
      localStorage.setItem('user_info', JSON.stringify({
        first_name: formData.first_name,
        last_name: formData.last_name,
        business_name: formData.business_name,
        phone_number: formData.phone_number,
        email: formData.email
      }));
      setTimeout(() => router.push('/onboarding'), 500);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background3">

      {/* ── Centered card ── */}
      <div className="flex w-full max-w-[860px] rounded-[22px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.55)]">

        {/* ── LEFT PANEL — animated aura ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[42%] shrink-0 p-9 relative overflow-hidden"
          style={{ background: AURA.baseBg, minHeight: '580px' }}
        >
          {/* Animated blobs */}
          {AURA.blobs.map((b, i) => (
            <div
              key={i}
              className="blob absolute rounded-full pointer-events-none"
              style={{
                width: b.size,
                height: b.size,
                top: b.top,
                left: b.left,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
                animationDuration: `${b.duration}s`,
                animationDelay: `${b.delay}s`,
              }}
            />
          ))}

          {/* Noise overlay for texture */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
          />

          {/* Logo / back link */}
          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-[0.4rem] text-white/70 hover:text-white transition-colors duration-200 text-[0.85rem] font-medium tracking-[-0.01em] group"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:-translate-x-[3px]">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Krew
            </Link>
          </div>

          {/* Headline + steps */}
          <div className="relative z-10">
            <h2 className="text-white text-[1.85rem] font-bold leading-[1.2] tracking-[-0.03em] mb-2">
              Get Started<br />with Us
            </h2>
            <p className="text-blue-300/70 text-[0.75rem] leading-[1.65] max-w-[200px] mb-7">
              Complete these easy steps to register your account.
            </p>

            {/* Step cards */}
            <div className="flex gap-[0.55rem]">
              {[
                { n: '1', label: 'Sign up your account' },
                { n: '2', label: 'Set up your workspace' },
                { n: '3', label: 'Set up your profile' },
              ].map((step, i) => (
                <div
                  key={step.n}
                  className="flex-1 rounded-[10px] px-[0.65rem] py-[0.7rem]"
                  style={{
                    background: i === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                    border: i === 0 ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span
                    className="flex items-center justify-center w-[18px] h-[18px] rounded-full text-[0.58rem] font-bold mb-[0.45rem]"
                    style={{
                      background: i === 0 ? 'white' : 'rgba(255,255,255,0.12)',
                      color: i === 0 ? '#1042a0' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {step.n}
                  </span>
                  <p
                    className="text-[0.63rem] leading-[1.4] font-medium"
                    style={{ color: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }}
                  >
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — form ── */}
        <div className="flex-1 flex items-center justify-center px-8 py-10 bg-background">
          <div className="w-full max-w-[340px]">

            {/* Mobile logo / back link */}
            <div className="lg:hidden mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-[0.4rem] text-text-secondary hover:text-text-primary transition-colors duration-200 text-[0.85rem] font-medium tracking-[-0.01em] group"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:-translate-x-[3px]">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Krew
              </Link>
            </div>

            <h1 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-text-primary mb-[0.2rem]">
              Sign Up Account
            </h1>
            <p className="text-[0.72rem] text-text-tertiary mb-6">
              Enter your personal data to create your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-[0.7rem]">
              {/* First + Last */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[0.62rem] text-text-tertiary mb-[0.3rem] block">First Name</label>
                  <input
                    type="text" required value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-background2 border border-border rounded-[8px] px-3 py-[8px] text-[0.76rem] text-text-primary outline-none focus:border-border-md transition-colors placeholder:text-text-tertiary"
                    placeholder="eg. John"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[0.62rem] text-text-tertiary mb-[0.3rem] block">Last Name</label>
                  <input
                    type="text" required value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-background2 border border-border rounded-[8px] px-3 py-[8px] text-[0.76rem] text-text-primary outline-none focus:border-border-md transition-colors placeholder:text-text-tertiary"
                    placeholder="eg. Francisco"
                  />
                </div>
              </div>

              {/* Brand Name */}
              <div>
                <label className="text-[0.62rem] text-text-tertiary mb-[0.3rem] block">Brand Name</label>
                <input
                  type="text" required value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full bg-background2 border border-border rounded-[8px] px-3 py-[8px] text-[0.76rem] text-text-primary outline-none focus:border-border-md transition-colors placeholder:text-text-tertiary"
                  placeholder="KARSA"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[0.62rem] text-text-tertiary mb-[0.3rem] block">Phone Number</label>
                <input
                  type="tel" value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-background2 border border-border rounded-[8px] px-3 py-[8px] text-[0.76rem] text-text-primary outline-none focus:border-border-md transition-colors placeholder:text-text-tertiary"
                  placeholder="+20 100 000 0000"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[0.62rem] text-text-tertiary mb-[0.3rem] block">Email</label>
                <input
                  type="email" required value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-background2 border border-border rounded-[8px] px-3 py-[8px] text-[0.76rem] text-text-primary outline-none focus:border-border-md transition-colors placeholder:text-text-tertiary"
                  placeholder="eg. johnfrans@gmail.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[0.62rem] text-text-tertiary mb-[0.3rem] block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-background2 border border-border rounded-[8px] px-3 py-[8px] pr-9 text-[0.76rem] text-text-primary outline-none focus:border-border-md transition-colors placeholder:text-text-tertiary"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
                    {showPassword ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[0.6rem] text-text-tertiary mt-[0.3rem]">Must be at least 8 characters.</p>
              </div>

              {error && <div className="text-red-400 text-[0.7rem]">{error}</div>}

              <button
                type="submit" disabled={loading}
                className="w-full bg-btn-bg text-btn-text rounded-[8px] py-[10px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity disabled:opacity-50 !mt-3"
              >
                {loading ? 'Creating account…' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-[0.7rem] text-text-tertiary mt-4">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-text-secondary hover:text-text-primary font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Blob keyframe animations */}
      <style jsx>{`
        /* ─────────────────────────────────────────────────────────────────────
           AURA ANIMATION — to adjust movement, change translateX/Y values.
           driftX=${AURA.driftX}px  driftY=${AURA.driftY}px (set in AURA const above)
           ───────────────────────────────────────────────────────────────────── */
        @keyframes drift0 {
          0%   { transform: translate(-50%, -50%) translate(0px, 0px); }
          33%  { transform: translate(-50%, -50%) translate(${AURA.driftX}px, -${AURA.driftY}px); }
          66%  { transform: translate(-50%, -50%) translate(-${AURA.driftX * 0.6}px, ${AURA.driftY}px); }
          100% { transform: translate(-50%, -50%) translate(0px, 0px); }
        }
        @keyframes drift1 {
          0%   { transform: translate(-50%, -50%) translate(0px, 0px); }
          40%  { transform: translate(-50%, -50%) translate(-${AURA.driftX}px, ${AURA.driftY * 0.7}px); }
          70%  { transform: translate(-50%, -50%) translate(${AURA.driftX * 0.5}px, -${AURA.driftY * 0.8}px); }
          100% { transform: translate(-50%, -50%) translate(0px, 0px); }
        }
        @keyframes drift2 {
          0%   { transform: translate(-50%, -50%) translate(0px, 0px); }
          50%  { transform: translate(-50%, -50%) translate(${AURA.driftX * 0.8}px, ${AURA.driftY}px); }
          100% { transform: translate(-50%, -50%) translate(0px, 0px); }
        }
        @keyframes drift3 {
          0%   { transform: translate(-50%, -50%) translate(0px, 0px); }
          30%  { transform: translate(-50%, -50%) translate(${AURA.driftX * 0.4}px, -${AURA.driftY * 0.6}px); }
          60%  { transform: translate(-50%, -50%) translate(-${AURA.driftX * 0.7}px, ${AURA.driftY * 0.4}px); }
          100% { transform: translate(-50%, -50%) translate(0px, 0px); }
        }
        .blob:nth-child(1) { animation: drift0 var(--d, 8s) ease-in-out infinite; }
        .blob:nth-child(2) { animation: drift1 var(--d, 11s) ease-in-out infinite; }
        .blob:nth-child(3) { animation: drift2 var(--d, 9s) ease-in-out infinite; }
        .blob:nth-child(4) { animation: drift3 var(--d, 13s) ease-in-out infinite; }
      `}</style>
    </div>
  );
}
