'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup, saveOnboarding } from '@/lib/api';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// POST /api/auth/signup
//   Body: { first_name, last_name, business_name, phone_number, email, password }
//   Returns: { access_token, user: { id, first_name, last_name, email } }
//
// POST /api/onboarding
//   Called after signup completes (step 2 of the same screen flow)
//   Body: { business_type, revenue_range, dm_volume, pain_point, brand_description }
//   Returns: { success: boolean }
// =============================================================================

// =============================================================================
// AURA — animated left panel
// =============================================================================
const AURA = {
  baseBg: '#0a1628',
  blobs: [
    { color: 'rgba(30, 80, 220, 0.55)',  size: 420, top: '30%', left: '20%', duration: 8,  delay: 0 },
    { color: 'rgba(60, 120, 255, 0.35)', size: 320, top: '60%', left: '55%', duration: 11, delay: 2 },
    { color: 'rgba(100,170,255, 0.20)',  size: 260, top: '10%', left: '60%', duration: 9,  delay: 4 },
    { color: 'rgba(20,  50, 180, 0.45)', size: 360, top: '70%', left: '5%',  duration: 13, delay: 1 },
  ],
  driftX: 60,
  driftY: 50,
};
// =============================================================================

// Onboarding steps
type OptionStep   = { type: 'options';  eyebrow: string; question: string; sub: string; key: string; options: string[] };
type TextareaStep = { type: 'textarea'; eyebrow: string; question: string; sub: string; key: string; placeholder: string; helper: string };
type OBStep = OptionStep | TextareaStep;

const OB_STEPS: OBStep[] = [
  {
    type: 'options', eyebrow: 'Step 1 — Business type',
    question: 'What type of business do you run?',
    sub: 'This helps Luna adapt her tone and responses to your industry.',
    key: 'businessType',
    options: ['Fashion', 'Accessories', 'Fragrances', 'Cosmetics', 'General E-commerce', 'Other'],
  },
  {
    type: 'options', eyebrow: 'Step 2 — Revenue range',
    question: 'What is your average monthly revenue?',
    sub: 'Helps us understand your scale so we can set Luna up correctly.',
    key: 'revenueRange',
    options: ['0 – 50,000', '50,000 – 200,000', '200,000 – 500,000', '500,000+'],
  },
  {
    type: 'options', eyebrow: 'Step 3 — DM volume',
    question: 'How many customer DMs do you receive per day?',
    sub: 'This determines how Luna is configured for your inbox load.',
    key: 'dmVolume',
    options: ['0 – 20', '20 – 60', '60 – 150', '150+'],
  },
  {
    type: 'options', eyebrow: 'Step 4 — Main challenge',
    question: 'What is your biggest challenge right now?',
    sub: 'Luna will prioritize solving this for you first.',
    key: 'painPoint',
    options: ['Slow response time', 'Missed orders in DMs', 'Managing team replies', 'Tracking customer issues', 'Scaling customer support'],
  },
  {
    type: 'textarea', eyebrow: 'Step 5 — Brand description',
    question: 'Describe your brand.',
    sub: 'Two sentences is all Luna needs to match your voice.',
    key: 'brandDescription',
    placeholder: 'KARSA is a streetwear brand built for youth with a grungy, rebellious edge. We keep it raw, affordable, and unapologetic.',
    helper: "Luna will use this to match your brand's tone in every customer reply.",
  },
];

const LEFT_STEPS = [
  { n: '1', label: 'Sign up your account' },
  { n: '2', label: 'Set up your workspace' },
  { n: '3', label: 'Set up your profile' },
];

type Phase = 'signup' | 'onboarding';

export default function SignupPage() {
  const router = useRouter();

  // ── Phase
  const [phase, setPhase] = useState<Phase>('signup');

  // ── Signup form
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', business_name: '',
    phone_number: '', email: '', password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // ── Onboarding
  const [obStep, setObStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [obLoading, setObLoading] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  // Which left bullet is active
  // 0 = signup, 1 = ob steps 0-3, 2 = ob step 4 (brand description)
  const activeLeft = phase === 'signup' ? 0 : obStep < 4 ? 1 : 2;

  // ── Signup submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupLoading(true);
    try {
      await signup(formData);
      localStorage.setItem('user_info', JSON.stringify({
        first_name: formData.first_name,
        last_name: formData.last_name,
        business_name: formData.business_name,
        phone_number: formData.phone_number,
        email: formData.email,
      }));
      setPhase('onboarding');
    } catch (err: any) {
      setSignupError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  // ── Onboarding navigation
  const step = OB_STEPS[obStep];
  const obTotal = OB_STEPS.length;
  const canContinue = step?.type === 'textarea' ? textValue.trim().length > 0 : selected !== null;

  const handleObNext = async () => {
    if (!canContinue) return;
    const value = step.type === 'textarea' ? textValue.trim() : selected!;
    const updatedAnswers = { ...answers, [step.key]: value };
    setAnswers(updatedAnswers);

    if (obStep < obTotal - 1) {
      const next = OB_STEPS[obStep + 1];
      setObStep(obStep + 1);
      if (next.type === 'options') { setSelected(updatedAnswers[next.key] ?? null); setTextValue(''); }
      else { setSelected(null); setTextValue(updatedAnswers[next.key] ?? ''); }
    } else {
      setObLoading(true);
      try { await saveOnboarding(updatedAnswers); } catch { /* silent fail */ }
      setTimeout(() => {
        setObLoading(false);
        setShowWelcomeToast(true);
        setTimeout(() => router.push('/dashboard'), 1500);
      }, 2000);
    }
  };

  const handleObBack = () => {
    if (obStep === 0) { setPhase('signup'); return; }
    const prev = OB_STEPS[obStep - 1];
    setObStep(obStep - 1);
    if (prev.type === 'options') { setSelected(answers[prev.key] ?? null); setTextValue(''); }
    else { setSelected(null); setTextValue(answers[prev.key] ?? ''); }
  };

  // ── Loading overlay
  if (obLoading) {
    return (
      <div className="fixed inset-0 z-[500] bg-background flex flex-col items-center justify-center gap-6">
        <div className="w-7 h-7 border-[1.5px] border-border border-t-text-secondary rounded-full animate-spin" />
        <div className="text-center">
          <div className="text-base font-light tracking-[-0.02em] text-text-primary">Building your Krew…</div>
          <div className="text-[0.72rem] text-text-tertiary mt-[0.3rem]">Optimizing Luna for your business</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background3">

      {/* ── Centered card ── */}
      <div className="flex w-full max-w-[900px] rounded-[22px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.55)]">

        {/* ── LEFT PANEL — animated aura + step bullets ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[40%] shrink-0 p-9 relative overflow-hidden"
          style={{ background: AURA.baseBg, minHeight: '620px' }}
        >
          {/* Animated blobs */}
          {AURA.blobs.map((b, i) => (
            <div
              key={i}
              className="blob absolute rounded-full pointer-events-none"
              style={{
                width: b.size, height: b.size,
                top: b.top, left: b.left,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
                animationDuration: `${b.duration}s`,
                animationDelay: `${b.delay}s`,
              }}
            />
          ))}

          {/* Noise overlay */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
          />

          {/* Logo / back */}
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

          {/* Headline + step bullets */}
          <div className="relative z-10">
            <h2 className="text-white text-[1.85rem] font-bold leading-[1.2] tracking-[-0.03em] mb-2">
              Get Started<br />with Us
            </h2>
            <p className="text-blue-300/70 text-[0.75rem] leading-[1.65] max-w-[200px] mb-7">
              Complete these easy steps to register your account.
            </p>

            <div className="flex gap-[0.55rem]">
              {LEFT_STEPS.map((ls, i) => {
                const isActive = i === activeLeft;
                const isDone = i < activeLeft;
                return (
                  <div
                    key={ls.n}
                    className="flex-1 rounded-[10px] px-[0.65rem] py-[0.7rem] transition-all duration-500"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                      border: isActive ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-[18px] h-[18px] rounded-full text-[0.58rem] font-bold mb-[0.45rem] transition-all duration-300"
                      style={{
                        background: isActive ? 'white' : isDone ? 'rgba(100,200,120,0.7)' : 'rgba(255,255,255,0.12)',
                        color: isActive ? '#1042a0' : isDone ? '#fff' : 'rgba(255,255,255,0.35)',
                      }}
                    >
                      {isDone ? '✓' : ls.n}
                    </span>
                    <p
                      className="text-[0.63rem] leading-[1.4] font-medium transition-all duration-300"
                      style={{ color: isActive ? 'rgba(255,255,255,0.9)' : isDone ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)' }}
                    >
                      {ls.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 bg-background overflow-y-auto" style={{ maxHeight: '90vh' }}>
          <div className="w-full max-w-[360px] mx-auto">

            {/* Mobile back link */}
            <div className="lg:hidden mb-6">
              <Link href="/" className="inline-flex items-center gap-[0.4rem] text-text-secondary hover:text-text-primary transition-colors duration-200 text-[0.85rem] font-medium tracking-[-0.01em] group">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:-translate-x-[3px]">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Krew
              </Link>
            </div>

            {/* ── SIGNUP FORM ── */}
            {phase === 'signup' && (
              <>
                <h1 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-text-primary mb-[0.2rem]">
                  Sign Up Account
                </h1>
                <p className="text-[0.72rem] text-text-tertiary mb-6">
                  Enter your personal data to create your account.
                </p>

                <form onSubmit={handleSignupSubmit} className="space-y-[0.7rem]">
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

                  <div>
                    <label className="text-[0.62rem] text-text-tertiary mb-[0.3rem] block">Brand Name</label>
                    <input
                      type="text" required value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className="w-full bg-background2 border border-border rounded-[8px] px-3 py-[8px] text-[0.76rem] text-text-primary outline-none focus:border-border-md transition-colors placeholder:text-text-tertiary"
                      placeholder="KARSA"
                    />
                  </div>

                  <div>
                    <label className="text-[0.62rem] text-text-tertiary mb-[0.3rem] block">Phone Number</label>
                    <input
                      type="tel" value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full bg-background2 border border-border rounded-[8px] px-3 py-[8px] text-[0.76rem] text-text-primary outline-none focus:border-border-md transition-colors placeholder:text-text-tertiary"
                      placeholder="+20 100 000 0000"
                    />
                  </div>

                  <div>
                    <label className="text-[0.62rem] text-text-tertiary mb-[0.3rem] block">Email</label>
                    <input
                      type="email" required value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-background2 border border-border rounded-[8px] px-3 py-[8px] text-[0.76rem] text-text-primary outline-none focus:border-border-md transition-colors placeholder:text-text-tertiary"
                      placeholder="eg. johnfrans@gmail.com"
                    />
                  </div>

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

                  {signupError && <div className="text-red-400 text-[0.7rem]">{signupError}</div>}

                  <button
                    type="submit" disabled={signupLoading}
                    className="w-full bg-btn-bg text-btn-text rounded-[8px] py-[10px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity disabled:opacity-50 !mt-3"
                  >
                    {signupLoading ? 'Creating account…' : 'Sign Up'}
                  </button>
                </form>

                <p className="text-center text-[0.7rem] text-text-tertiary mt-4">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-text-secondary hover:text-text-primary font-medium">
                    Log in
                  </Link>
                </p>
              </>
            )}

            {/* ── ONBOARDING STEPS ── */}
            {phase === 'onboarding' && (
              <div className="ob-step-content" key={obStep}>
                {/* Mini progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-[0.58rem] text-text-tertiary tracking-[0.08em] uppercase mb-[0.5rem]">
                    <span>Step {obStep + 1} of {obTotal}</span>
                    <span>{Math.round(((obStep + 1) / obTotal) * 100)}%</span>
                  </div>
                  <div className="h-[2px] bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-text-secondary rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      style={{ width: `${Math.round(((obStep + 1) / obTotal) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Eyebrow */}
                <div className="text-[0.58rem] uppercase tracking-[0.1em] text-text-tertiary mb-[0.7rem]">
                  {step.eyebrow}
                </div>

                {/* Question */}
                <h1 className="text-[1.15rem] font-semibold tracking-[-0.025em] leading-[1.25] text-text-primary mb-1">
                  {step.question}
                </h1>
                <p className="text-[0.7rem] text-text-tertiary mb-5 leading-[1.6]">
                  {step.sub}
                </p>

                {/* Options */}
                {step.type === 'options' && (
                  <div className="flex flex-col gap-[0.45rem]">
                    {step.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelected(option)}
                        className={`flex items-center justify-between px-4 py-[0.75rem] border rounded-[8px] transition-all duration-[150ms] text-[0.75rem] text-left w-full ${
                          selected === option
                            ? 'border-border-hover text-text-primary bg-background3'
                            : 'bg-background2 border-border text-text-secondary hover:border-border-md hover:text-text-primary hover:bg-background3'
                        }`}
                      >
                        <span>{option}</span>
                        <span className={`w-[14px] h-[14px] border rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ${
                          selected === option
                            ? 'border-text-secondary bg-text-secondary after:content-[""] after:w-[4px] after:h-[4px] after:rounded-full after:bg-background'
                            : 'border-border'
                        }`} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Textarea */}
                {step.type === 'textarea' && (
                  <div>
                    <textarea
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      placeholder={step.placeholder}
                      rows={5}
                      className="w-full bg-background2 border border-border rounded-[8px] px-4 py-3 text-[0.75rem] text-text-primary leading-[1.7] outline-none focus:border-border-md transition-colors duration-200 resize-none placeholder:text-text-tertiary"
                    />
                    <p className="text-[0.63rem] text-text-tertiary mt-[0.5rem] leading-[1.6]">
                      {step.helper}
                    </p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={handleObBack}
                    className="text-[0.72rem] text-text-tertiary hover:text-text-secondary transition-colors duration-200"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleObNext}
                    disabled={!canContinue}
                    className={`bg-btn-bg text-btn-text px-5 py-[8px] rounded-[8px] text-[0.75rem] font-medium transition-opacity duration-200 ${
                      canContinue ? 'opacity-100 hover:opacity-85' : 'opacity-30 pointer-events-none'
                    }`}
                  >
                    {obStep === obTotal - 1 ? 'Finish' : 'Continue'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Welcome toast */}
      {showWelcomeToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background2 border border-border-md rounded-[10px] px-6 py-[0.9rem] flex items-center gap-[0.7rem] text-[0.75rem] text-text-secondary shadow-[0_8px_32px_rgba(0,0,0,0.2)] z-[400] whitespace-nowrap animate-toastIn">
          <span className="w-[6px] h-[6px] rounded-full bg-text-secondary animate-pulse flex-shrink-0" />
          Luna is now optimized for your brand.
        </div>
      )}

      <style jsx>{`
        @keyframes drift0 {
          0%   { transform: translate(-50%,-50%) translate(0,0); }
          33%  { transform: translate(-50%,-50%) translate(${AURA.driftX}px,-${AURA.driftY}px); }
          66%  { transform: translate(-50%,-50%) translate(-${AURA.driftX * 0.6}px,${AURA.driftY}px); }
          100% { transform: translate(-50%,-50%) translate(0,0); }
        }
        @keyframes drift1 {
          0%   { transform: translate(-50%,-50%) translate(0,0); }
          40%  { transform: translate(-50%,-50%) translate(-${AURA.driftX}px,${AURA.driftY * 0.7}px); }
          70%  { transform: translate(-50%,-50%) translate(${AURA.driftX * 0.5}px,-${AURA.driftY * 0.8}px); }
          100% { transform: translate(-50%,-50%) translate(0,0); }
        }
        @keyframes drift2 {
          0%   { transform: translate(-50%,-50%) translate(0,0); }
          50%  { transform: translate(-50%,-50%) translate(${AURA.driftX * 0.8}px,${AURA.driftY}px); }
          100% { transform: translate(-50%,-50%) translate(0,0); }
        }
        @keyframes drift3 {
          0%   { transform: translate(-50%,-50%) translate(0,0); }
          30%  { transform: translate(-50%,-50%) translate(${AURA.driftX * 0.4}px,-${AURA.driftY * 0.6}px); }
          60%  { transform: translate(-50%,-50%) translate(-${AURA.driftX * 0.7}px,${AURA.driftY * 0.4}px); }
          100% { transform: translate(-50%,-50%) translate(0,0); }
        }
        .blob:nth-child(1) { animation: drift0 8s  ease-in-out infinite; }
        .blob:nth-child(2) { animation: drift1 11s ease-in-out infinite; }
        .blob:nth-child(3) { animation: drift2 9s  ease-in-out infinite; }
        .blob:nth-child(4) { animation: drift3 13s ease-in-out infinite; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-toastIn { animation: toastIn 0.4s 0.3s ease both; }
        .ob-step-content { animation: fadeUp 0.35s ease both; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
