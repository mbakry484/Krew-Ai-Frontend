'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  submitWaitlist,
  type WaitlistData,
  type WaitlistPlatform,
  type WaitlistDmsBucket,
} from '@/lib/waitlist';
import '../auth/signup/onboarding.css';

// =============================================================================
// /early-access — invite-only waitlist, built as a multi-STEP flow that mirrors
// the Luna signup/onboarding screens one-to-one (same shell, progress bar, step
// counter, kicker, two-tone heading, Luna chip, Back/Continue footer).
//
// Reuses the onboarding design system (app/auth/signup/onboarding.css). Step
// transitions ride the same CSS `obStageIn` animation via React `key` remount —
// no animation library, identical feel to the real flow.
//
// Submit → lib/waitlist.ts placeholder (console.log + resolve).
// FRONTEND ONLY — no backend, no auth changes. Does not touch /auth/*.
// =============================================================================

// -----------------------------------------------------------------------------
// Icons (ported from the signup flow — same Krew style)
// -----------------------------------------------------------------------------
type IcoProps = { size?: number; sw?: number; children?: ReactNode };
const Ico = ({ children, size = 16, sw = 1.5 }: IcoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const IconArrowRight = (p: IcoProps) => (
  <Ico {...p} sw={p.sw || 1.6}><path d="M5 12h14M13 6l6 6-6 6" /></Ico>
);
const IconArrowLeft = (p: IcoProps) => (
  <Ico {...p} sw={p.sw || 1.6}><path d="M19 12H5M11 6l-6 6 6 6" /></Ico>
);
const LunaMark = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M15.5 3.5a9 9 0 1 0 5 5 7 7 0 0 1-5-5z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
  </svg>
);

type LunaState = 'idle' | 'typing' | 'alive' | 'thinking';
function LunaChip({ line, state = 'idle' }: { line: string; state?: LunaState }) {
  return (
    <div className={`luna-line-wrap luna-${state}`}>
      <span className="luna-mark"><LunaMark size={13} /></span>
      <span className="luna-line" key={line}>
        {line}
        {state === 'typing' && <span className="luna-typing"><span /><span /><span /></span>}
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Cold open — cinematic typed intro. Line 1 types itself out, line 2 fades in
// beneath, then the whole thing dissolves and auto-advances into Step 01.
// Click/tap (or the subtle "→") skips the wait. Respects prefers-reduced-motion.
// -----------------------------------------------------------------------------
const COLD_LINE_1 = "Luna isn't open to everyone yet.";
const COLD_LINE_2 = "Let's see if you're a fit.";

function ColdOpen({ onNext }: { onNext: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onNext();
  }, [onNext]);

  const skip = useCallback(() => {
    if (doneRef.current) return;
    setLeaving(true);
    window.setTimeout(finish, 340);
  }, [finish]);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduce) {
      // Lines render statically (blur-in disabled in CSS) — hold, then advance.
      timers.push(setTimeout(finish, 1800));
    } else {
      timers.push(setTimeout(() => setLeaving(true), 3200)); // hold, then dissolve
      timers.push(setTimeout(finish, 3740));                 // advance after the fade
    }
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  return (
    <div
      className={`ea-cold ${leaving ? 'is-leaving' : ''}`}
      onClick={skip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); } }}
      aria-label="Continue to the early-access form"
    >
      <h1 className="ea-cold-line ea-cold-l1 hero-blur-in">{COLD_LINE_1}</h1>
      <p className="ea-cold-line ea-cold-l2 hero-blur-in" style={{ animationDelay: '1150ms' }}>
        {COLD_LINE_2}
      </p>
      <span
        className="ea-cold-hint ds-eyebrow hero-blur-in"
        style={{ animationDelay: '2050ms' }}
        aria-hidden="true"
      >
        Click anywhere to continue
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------
type WState = {
  brand: string;
  instagram: string;
  platform: WaitlistPlatform | '';
  dms: WaitlistDmsBucket | '';
  market: string;
  email: string;
  pain: string;       // selected pain-point option value
  painOther: string;  // optional free-text "something else"
};

const INITIAL: WState = {
  brand: '',
  instagram: '',
  platform: '',
  dms: '',
  market: 'Egypt',
  email: '',
  pain: '',
  painOther: '',
};

const PLATFORMS: { value: WaitlistPlatform; label: string }[] = [
  { value: 'shopify', label: 'Shopify' },
  { value: 'other', label: 'Other platform' },
  { value: 'no', label: 'None yet' },
];
const DMS_BUCKETS: { value: WaitlistDmsBucket; label: string }[] = [
  { value: '<50', label: 'Under 50' },
  { value: '50-200', label: '50 – 200' },
  { value: '200-500', label: '200 – 500' },
  { value: '500+', label: '500+' },
];
const PAIN_OPTIONS: { value: string; label: string }[] = [
  { value: 'repetitive', label: 'Drowning in repetitive DMs (same questions all day)' },
  { value: 'afterhours', label: 'DMs at 2am / outside work hours' },
  { value: 'multilingual', label: 'Replying in Arabic + English + Franco' },
  { value: 'orders', label: 'Orders & returns eating my time' },
  { value: 'slow', label: 'Losing sales — I reply too slow' },
];

// Personalized success line, mapped from the picked pain. Falls back to neutral.
const PAIN_SUCCESS: Record<string, string> = {
  repetitive: 'When your spot opens, Luna takes the repetitive DMs off your plate first.',
  afterhours: 'When your spot opens, the first thing Luna kills is the 2am DMs.',
  multilingual: 'When your spot opens, Luna replies in Arabic, Franco, and English — automatically.',
  orders: 'When your spot opens, Luna handles the orders and returns for you.',
  slow: 'When your spot opens, Luna answers in seconds — even while you sleep.',
};
const PAIN_SUCCESS_FALLBACK = 'When your spot opens, Luna starts handling your DMs from day one.';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// -----------------------------------------------------------------------------
// Step shape (mirrors StepDef from the signup flow)
// -----------------------------------------------------------------------------
type StepCtx = { state: WState; set: (patch: Partial<WState>) => void; onNext: () => void };
type StepDef = {
  id: string;
  progressVisible: boolean;
  hasFooter: boolean;
  luna: (s: WState) => { state: LunaState; line: string };
  valid: (s: WState) => boolean;
  render: (ctx: StepCtx) => ReactNode;
};

// Intro — cinematic typed cold open
const StepIntro: StepDef = {
  id: 'intro',
  progressVisible: false,
  hasFooter: false,
  luna: () => ({ state: 'idle', line: '' }),
  valid: () => true,
  render: ({ onNext }) => <ColdOpen onNext={onNext} />,
};

// Step 01 — Your brand
const StepBrand: StepDef = {
  id: 'brand',
  progressVisible: true,
  hasFooter: true,
  luna: ({ brand }) =>
    brand ? { state: 'idle', line: `Nice to meet you, ${brand}.` } : { state: 'idle', line: 'What should I call your store?' },
  valid: ({ brand, instagram }) => brand.trim().length >= 2 && instagram.trim().length >= 1,
  render: ({ state, set }) => (
    <div className="form-screen">
      <div className="form-head">
        <div className="ds-eyebrow">Step 01 — Your brand</div>
        <h2 className="form-title ds-h1-mixed">
          <span className="emph">First,</span> <span className="rest">who are you?</span>
        </h2>
        <p className="ds-body form-sub">Your name, and where customers already find you.</p>
      </div>
      <div className="form-fields">
        <label className="field">
          <span className="field-lbl">Brand / store name</span>
          <input
            className="field-input"
            placeholder="Noor Atelier"
            value={state.brand}
            autoFocus
            onChange={(e) => set({ brand: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-lbl">Instagram handle</span>
          <div className="field-compound">
            <span className="field-suffix" style={{ padding: '0 4px 0 14px' }}>@</span>
            <input
              className="field-input"
              placeholder="noor.atelier"
              value={state.instagram}
              style={{ paddingLeft: 0 }}
              onChange={(e) => set({ instagram: e.target.value.replace(/^@/, '') })}
            />
          </div>
        </label>
      </div>
    </div>
  ),
};

// Step 02 — Your setup
const StepSetup: StepDef = {
  id: 'setup',
  progressVisible: true,
  hasFooter: true,
  luna: () => ({ state: 'idle', line: 'How are you running things today?' }),
  valid: ({ platform, dms }) => !!platform && !!dms,
  render: ({ state, set }) => (
    <div className="form-screen">
      <div className="form-head">
        <div className="ds-eyebrow">Step 02 — Your setup</div>
        <h2 className="form-title ds-h1-mixed">
          <span className="emph">Where</span> <span className="rest">does Luna plug in?</span>
        </h2>
        <p className="ds-body form-sub">So we know what we&apos;re working with.</p>
      </div>
      <div className="form-fields">
        <label className="field">
          <span className="field-lbl">On Shopify?</span>
          <select
            className="field-input ea-select"
            value={state.platform}
            onChange={(e) => set({ platform: e.target.value as WaitlistPlatform })}
          >
            <option value="" disabled>Select one</option>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-lbl">DMs per week</span>
          <select
            className="field-input ea-select"
            value={state.dms}
            onChange={(e) => set({ dms: e.target.value as WaitlistDmsBucket })}
          >
            <option value="" disabled>Select a range</option>
            {DMS_BUCKETS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  ),
};

// Step 03 — Your market
const StepMarket: StepDef = {
  id: 'market',
  progressVisible: true,
  hasFooter: true,
  luna: ({ market }) =>
    market.trim() ? { state: 'idle', line: `${market.trim()}. Got it.` } : { state: 'idle', line: 'Where do you sell?' },
  valid: ({ market }) => market.trim().length >= 2,
  render: ({ state, set }) => (
    <div className="form-screen">
      <div className="form-head">
        <div className="ds-eyebrow">Step 03 — Your market</div>
        <h2 className="form-title ds-h1-mixed">
          <span className="emph">Where</span> <span className="rest">do you operate?</span>
        </h2>
        <p className="ds-body form-sub">Helps us line up the right cohort for you.</p>
      </div>
      <div className="form-fields">
        <label className="field">
          <span className="field-lbl">Market / country</span>
          <input
            className="field-input"
            placeholder="Egypt"
            value={state.market}
            autoFocus
            onChange={(e) => set({ market: e.target.value })}
          />
        </label>
      </div>
    </div>
  ),
};

// Step 04 — Reach you
const StepReach: StepDef = {
  id: 'reach',
  progressVisible: true,
  hasFooter: true,
  luna: () => ({ state: 'idle', line: 'Last thing — where do we reach you?' }),
  valid: ({ email, pain }) => EMAIL_RE.test(email.trim()) && !!pain,
  render: ({ state, set }) => (
    <div className="form-screen">
      <div className="form-head">
        <div className="ds-eyebrow">Step 04 — Reach you</div>
        <h2 className="form-title ds-h1-mixed">
          <span className="emph">How</span> <span className="rest">do we reach you?</span>
        </h2>
        <p className="ds-body form-sub">We&apos;ll only email when a spot opens — nothing else.</p>
      </div>
      <div className="form-fields">
        <label className="field">
          <span className="field-lbl">Work email</span>
          <input
            type="email"
            className="field-input"
            placeholder="you@yourbrand.com"
            value={state.email}
            autoFocus
            onChange={(e) => set({ email: e.target.value })}
          />
        </label>
        <div className="field">
          <span className="field-lbl">What&apos;s eating your time right now?</span>
          <div className="voice-list ea-pain-list">
            {PAIN_OPTIONS.map((o) => (
              <button
                type="button"
                key={o.value}
                className={`voice-row ${state.pain === o.value ? 'selected' : ''}`}
                onClick={() => set({ pain: o.value })}
              >
                <div className="voice-radio"><span /></div>
                <div className="voice-text"><div className="voice-head">{o.label}</div></div>
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span className="field-lbl">
            Something else?{' '}
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
          </span>
          <input
            className="field-input"
            placeholder="One line, if it's not above"
            value={state.painOther}
            onChange={(e) => set({ painOther: e.target.value })}
          />
        </label>
      </div>
    </div>
  ),
};

const ALL_STEPS: StepDef[] = [StepIntro, StepBrand, StepSetup, StepMarket, StepReach];

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function EarlyAccessPage() {
  const [idx, setIdx] = useState(0);
  const [state, setState] = useState<WState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (patch: Partial<WState>) => setState((s) => ({ ...s, ...patch }));

  const step = ALL_STEPS[idx];
  const luna = step.luna(state);
  const visibleSteps = ALL_STEPS.filter((s) => s.progressVisible);
  const progressIdx = visibleSteps.findIndex((s) => s.id === step.id);
  const progressTotal = visibleSteps.length;
  const isLastStep = idx === ALL_STEPS.length - 1;

  const goNext = async () => {
    if (!step.valid(state)) return;
    if (!isLastStep) {
      setIdx((i) => i + 1);
      return;
    }
    // Final step — submit the waitlist entry
    setSubmitting(true);
    try {
      const painLabel = PAIN_OPTIONS.find((o) => o.value === state.pain)?.label;
      const painPoint =
        [painLabel, state.painOther.trim()].filter(Boolean).join(' — ') || undefined;
      const payload: WaitlistData = {
        email: state.email.trim(),
        brandName: state.brand.trim(),
        instagramHandle: state.instagram.trim().replace(/^@/, ''),
        platform: state.platform as WaitlistPlatform,
        dmsPerWeek: state.dms as WaitlistDmsBucket,
        market: state.market.trim(),
        painPoint,
      };
      await submitWaitlist(payload);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (idx === 0) return;
    setIdx((i) => Math.max(0, i - 1));
  };

  const continueDisabled = !step.valid(state) || submitting;
  const ctx: StepCtx = { state, set, onNext: goNext };

  // ── Success — calm confirmation, same heading/subcopy language, no counter ──
  if (submitted) {
    return (
      <div className="luna-onboard-root ea-flow">
        <div className="luna-onboard-bg">
          <div className="luna-onboard-glow glow-1" />
          <div className="luna-onboard-glow glow-2" />
        </div>
        <div className="luna-onboard-stage-outer">
          <div className="luna-onboard-card">
            <div className="ob-shell" data-phase="luna">
              <div className="ob-stage" key="success">
                <div className="ob-stage-inner">
                  <div className="ea-success-mark">
                    <span className="ea-success-ring" />
                    <span className="ea-success-core"><LunaMark size={24} /></span>
                  </div>
                  <div className="form-screen">
                    <div className="form-head">
                      <div className="ds-eyebrow">Early access</div>
                      <h2 className="form-title ds-h1-mixed">
                        <span className="emph">You&apos;re on the list.</span>
                      </h2>
                      <p className="ds-body form-sub">
                        We&apos;ll email <span className="ea-hl">{state.email.trim()}</span> when a spot
                        opens for {state.brand.trim() || 'your brand'}. We onboard a few brands at a
                        time — so it&apos;s worth the wait.
                      </p>
                      <p className="ds-body ea-success-line">
                        {PAIN_SUCCESS[state.pain] || PAIN_SUCCESS_FALLBACK}
                      </p>
                    </div>
                    <div className="signup-switch">
                      Already onboarded? <Link href="/auth/login">Log in</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <FlowStyles />
      </div>
    );
  }

  return (
    <div className="luna-onboard-root ea-flow">
      <div className="luna-onboard-bg">
        <div className="luna-onboard-glow glow-1" />
        <div className="luna-onboard-glow glow-2" />
      </div>

      <div className="luna-onboard-stage-outer">
        <div className="luna-onboard-card">
          <div className="ob-shell" data-phase="luna">
            {step.progressVisible && (
              <div className="ob-progress-bar">
                <div className="ob-progress-track">
                  <div
                    className="ob-progress-fill"
                    style={{ width: `${((progressIdx + 1) / progressTotal) * 100}%` }}
                  />
                </div>
                <div className="ob-progress-meta">
                  <span className="ob-brand">
                    <span className="ob-brand-mark">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M15.5 3.5a9 9 0 1 0 5 5 7 7 0 0 1-5-5z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
                      </svg>
                    </span>
                    Early access
                  </span>
                  <span className="ob-counter">
                    {String(progressIdx + 1).padStart(2, '0')} <span className="sep">/</span>{' '}
                    {String(progressTotal).padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            <div className="ob-stage" key={step.id}>
              <div className="ob-stage-inner">
                {step.id !== 'intro' && <LunaChip line={luna.line} state={luna.state} />}
                {step.render(ctx)}
              </div>
            </div>

            {step.hasFooter && (
              <div className="ob-footer">
                <div className="ob-foot-nav">
                  <button type="button" className="ob-btn-ghost" onClick={goBack}>
                    <IconArrowLeft size={12} sw={1.8} /> Back
                  </button>
                  <button type="button" className="ob-btn-primary" onClick={goNext} disabled={continueDisabled}>
                    {submitting ? (
                      <>Submitting…</>
                    ) : isLastStep ? (
                      <>Request access <IconArrowRight size={12} sw={1.8} /></>
                    ) : (
                      <>Continue <IconArrowRight size={12} sw={1.8} /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <FlowStyles />
    </div>
  );
}

// Scoped tweaks: clean select chevron, textarea, success mark, reduced-motion.
function FlowStyles() {
  return (
    <style jsx global>{`
      .ea-flow .ea-select {
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 30px;
      }
      .ea-flow .ea-hl { color: var(--text-primary); font-weight: 500; }

      /* ── Cold open — big, bold, blur-fade reveal (matches the landing hero) ── */
      /* Let the intro break out of the form's 560px column for a cinematic feel. */
      .ea-flow .ob-stage-inner:has(.ea-cold) { max-width: 860px; }
      .ea-flow .ea-cold {
        width: 100%;
        min-height: 62vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        cursor: pointer;
        text-align: center;
        padding: 48px 16px;
        transition: opacity 540ms cubic-bezier(0.25, 0.1, 0.25, 1),
                    filter 540ms cubic-bezier(0.25, 0.1, 0.25, 1);
        outline: none;
      }
      .ea-flow .ea-cold.is-leaving { opacity: 0; filter: blur(10px); }
      .ea-flow .ea-cold-line {
        margin: 0;
        font-size: clamp(2.2rem, 5.2vw, 4.2rem);
        letter-spacing: -0.045em;
        line-height: 1.03;
        max-width: 18ch;
      }
      .ea-flow .ea-cold-l1 { font-weight: 700; color: var(--text-primary); }
      .ea-flow .ea-cold-l2 { font-weight: 300; color: var(--text-secondary); }
      .ea-flow .ea-cold-hint { margin-top: 24px; }

      /* ── Pain single-select (reuses onboarding voice-row) ── */
      .ea-flow .ea-pain-list { max-width: none; }
      .ea-flow .ea-pain-list .voice-row { padding: 12px 14px; }
      .ea-flow .ea-pain-list .voice-head { margin-bottom: 0; }

      /* ── Personalized success line ── */
      .ea-flow .ea-success-line {
        color: var(--text-primary);
        font-weight: 400;
        margin-top: 12px;
      }

      /* Success mark — calm, premium, no confetti */
      .ea-flow .ea-success-mark {
        position: relative;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 6px;
      }
      .ea-flow .ea-success-ring {
        position: absolute;
        inset: 0;
        border-radius: 999px;
        border: 1px solid var(--accent-live);
        opacity: 0;
        animation: eaSuccessRing 2.4s ease-out infinite;
      }
      .ea-flow .ea-success-core {
        width: 54px;
        height: 54px;
        border-radius: 999px;
        background: var(--bg);
        border: 1px solid var(--accent-live);
        color: var(--accent-live);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 24px rgba(61, 187, 119, 0.25), var(--shadow-card);
      }
      @keyframes eaSuccessRing {
        0% { transform: scale(0.7); opacity: 0.6; }
        100% { transform: scale(1.5); opacity: 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .ea-flow .ob-stage { animation: none !important; }
        .ea-flow .luna-line,
        .ea-flow .ea-success-ring { animation: none !important; }
        .ea-flow .ea-cold .hero-blur-in { animation: none !important; }
        .ea-flow .ea-cold { transition: none !important; }
        .ea-flow .ob-progress-fill { transition: none !important; }
      }
    `}</style>
  );
}
