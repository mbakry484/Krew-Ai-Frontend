'use client';

import Link from 'next/link';
import { useState } from 'react';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// Static marketing page. No API calls.
// Prices shown are usage-tier base prices; real billing handled in dashboard.
// =============================================================================

type TierKey = 'bronze' | 'silver' | 'gold' | 'obsidian';

interface Tier {
  key: TierKey;
  name: string;
  tagline: string;
  priceLabel: string;
  period: string;
  maxConversations: number; // upper bound this tier covers
  quotas: {
    conversations: string;
    products: string;
    savedAnswers: string;
    activeIssues: string;
  };
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    key: 'bronze',
    name: 'Bronze',
    tagline: 'Solo operators',
    priceLabel: '$29',
    period: '/ month',
    maxConversations: 200,
    quotas: {
      conversations: '200',
      products: '50',
      savedAnswers: '5',
      activeIssues: '3',
    },
  },
  {
    key: 'silver',
    name: 'Silver',
    tagline: 'Growing stores',
    priceLabel: '$89',
    period: '/ month',
    maxConversations: 1000,
    quotas: {
      conversations: '1,000',
      products: '500',
      savedAnswers: '25',
      activeIssues: '15',
    },
  },
  {
    key: 'gold',
    name: 'Gold',
    tagline: 'Scale teams',
    priceLabel: '$249',
    period: '/ month',
    maxConversations: 5000,
    quotas: {
      conversations: '5,000',
      products: '5,000',
      savedAnswers: 'Unlimited',
      activeIssues: '50',
    },
    featured: true,
  },
  {
    key: 'obsidian',
    name: 'Obsidian',
    tagline: 'Enterprise',
    priceLabel: 'Custom',
    period: '',
    maxConversations: Infinity,
    quotas: {
      conversations: 'Unlimited',
      products: 'Unlimited',
      savedAnswers: 'Unlimited',
      activeIssues: 'Unlimited',
    },
  },
];

// Discrete slider stops — the thumb snaps to these values.
// Last stop represents 5,000+ (maps to Obsidian / Enterprise tier).
const STOPS: number[] = [50, 100, 200, 500, 1000, 2000, 3000, 5000, 5001];
const LAST_STOP_INDEX = STOPS.length - 1;

function tierForConversations(n: number): number {
  if (n <= 200) return 0;
  if (n <= 1000) return 1;
  if (n <= 5000) return 2;
  return 3;
}

function formatStopLabel(value: number): string {
  if (value > 5000) return '5,000+';
  return value.toLocaleString();
}

export default function PricingPage() {
  // Index into STOPS, not raw value — gives stepped/snapped UX
  const [stopIdx, setStopIdx] = useState(3); // default at 500
  const conversations = STOPS[stopIdx];
  const activeIdx = tierForConversations(conversations);
  const activeTier = TIERS[activeIdx];

  const [manualIdx, setManualIdx] = useState<number | null>(null);
  const displayedIdx = manualIdx ?? activeIdx;
  const displayedTier = TIERS[displayedIdx];

  const handleTierClick = (idx: number) => {
    setManualIdx(idx);
    // Snap slider to a representative stop for the selected tier
    const tierStopMap = [0, 3, 6, LAST_STOP_INDEX]; // Bronze→50, Silver→500, Gold→3000, Obsidian→5000+
    setStopIdx(tierStopMap[idx]);
  };

  const handleSliderChange = (v: number) => {
    setManualIdx(null);
    setStopIdx(v);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary pt-12">
      {/* ── HERO ── */}
      <section className="max-w-[960px] mx-auto px-8 pt-10 md:pt-14 pb-6 md:pb-8 text-center">
        <div className="text-[0.65rem] uppercase tracking-[0.14em] text-text-tertiary mb-[0.9rem]">
          Luna — your customer support agent
        </div>
        <h1 className="text-[clamp(1.6rem,3.8vw,2.4rem)] font-light tracking-[-0.028em] leading-[1.1] mb-[0.75rem]">
          Pricing that grows<br />with your store.
        </h1>
        <p className="text-[0.78rem] text-text-secondary leading-[1.75] max-w-[420px] mx-auto font-light">
          One Luna membership. Four quotas. Every feature in every tier — only the
          limits change as you scale.
        </p>
      </section>

      {/* ── CARD + SLIDER ── */}
      <section className="max-w-[1100px] mx-auto px-8 pb-14 md:pb-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left — stacked cards */}
          <div className="relative h-[260px] md:h-[300px] flex items-center justify-center">
            <div className="card-stack">
              {TIERS.map((tier, i) => {
                const diff = i - displayedIdx;
                const isActive = diff === 0;
                const behind = diff > 0; // stacked behind-above
                const past = diff < 0;   // gone (push down & fade)
                return (
                  <div
                    key={tier.key}
                    className={`pricing-card pricing-card-${tier.key}`}
                    style={{
                      transform: isActive
                        ? 'translate(-50%, -50%) translateY(0) scale(1)'
                        : behind
                          ? `translate(-50%, -50%) translateY(${-18 * diff}px) scale(${1 - 0.04 * diff})`
                          : `translate(-50%, -50%) translateY(${-24 * diff}px) scale(${1 + 0.02 * diff})`,
                      opacity: isActive ? 1 : behind ? Math.max(0, 0.5 - 0.15 * diff) : 0,
                      zIndex: 40 - Math.abs(diff),
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                    aria-hidden={!isActive}
                  >
                    <div className="pricing-card-sheen" />
                    <div className="pricing-card-inner">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-[0.4rem]">
                          <svg viewBox="665 1125 735 145" className="h-[11px] w-auto" fill="currentColor">
                            <g transform="translate(0,2350) scale(0.1,-0.1)">
                              <path d="M8005 11988 c-99 -106 -384 -399 -634 -650 l-454 -458 344 0 344 0 200 200 c110 110 207 200 216 200 9 0 23 -8 32 -18 15 -16 17 -45 17 -200 l0 -182 404 0 404 0 242 243 242 242 -183 3 c-114 1 -187 7 -196 13 -37 32 -20 53 352 424 201 201 365 367 365 370 0 3 -152 5 -338 5 l-338 0 -195 -193 c-107 -107 -201 -196 -210 -200 -22 -7 -59 19 -59 42 0 10 72 90 160 178 88 88 160 163 160 167 0 3 -156 6 -347 6 l-348 0 -180 -192z"/>
                              <path d="M9882 12148 c-9 -9 -12 -161 -12 -625 0 -595 1 -613 19 -623 28 -15 104 -12 127 4 18 14 19 26 16 204 -3 164 -1 195 13 224 23 44 168 178 194 178 14 0 76 -79 235 -304 119 -167 223 -307 232 -310 24 -9 147 -7 163 3 22 14 9 37 -145 248 -265 363 -342 472 -348 491 -5 15 42 67 235 255 135 132 239 242 237 249 -3 9 -31 14 -93 16 l-88 3 -296 -296 c-163 -162 -304 -295 -313 -295 -26 0 -30 41 -27 306 2 197 0 256 -10 268 -16 19 -121 22 -139 4z"/>
                              <path d="M11285 11816 c-65 -21 -97 -41 -151 -96 -29 -29 -57 -49 -63 -46 -6 4 -11 29 -11 56 0 60 -18 80 -70 80 -73 0 -70 19 -70 -464 0 -323 3 -435 12 -444 16 -16 113 -15 126 1 8 9 12 95 12 249 1 250 10 318 48 380 49 79 112 120 205 133 62 9 77 26 77 81 0 83 -25 98 -115 70z"/>
                              <path d="M11730 11816 c-181 -32 -311 -171 -347 -371 -24 -140 6 -298 80 -406 81 -121 203 -174 380 -167 86 3 110 8 153 31 91 46 151 112 180 196 18 52 11 68 -35 76 -56 9 -84 -7 -119 -68 -42 -75 -105 -107 -206 -107 -39 1 -88 7 -109 14 -84 31 -149 108 -166 200 -8 41 -6 51 10 67 18 18 38 19 328 19 263 0 310 2 321 15 17 21 8 132 -19 216 -67 212 -241 322 -451 285z m176 -154 c49 -25 100 -80 125 -136 23 -50 23 -60 3 -80 -13 -14 -49 -16 -243 -16 -254 0 -259 1 -247 63 14 75 85 154 165 184 49 18 146 11 197 -15z"/>
                              <path d="M12233 11803 c-28 -11 -18 -48 157 -588 32 -99 66 -206 75 -237 22 -79 34 -88 108 -88 34 0 67 4 73 8 16 10 24 40 105 362 65 263 82 311 101 292 4 -4 43 -148 87 -320 44 -172 85 -320 91 -328 19 -22 132 -19 152 4 9 9 50 125 91 257 42 132 101 319 132 415 59 187 61 200 43 218 -18 18 -93 15 -116 -5 -16 -14 -43 -98 -106 -331 -47 -172 -91 -323 -97 -334 -11 -21 -12 -21 -25 -4 -7 10 -20 48 -28 85 -13 56 -104 412 -137 533 -5 20 -16 44 -25 53 -22 22 -116 20 -142 -2 -16 -14 -37 -86 -91 -306 -39 -158 -71 -292 -71 -298 0 -5 -7 -26 -15 -46 -13 -32 -17 -35 -29 -22 -8 8 -30 75 -51 149 -20 74 -45 164 -55 200 -10 36 -33 119 -50 185 -37 139 -50 155 -119 154 -25 0 -52 -3 -58 -6z"/>
                              <path d="M13656 11755 c-41 -22 -55 -44 -56 -90 0 -75 62 -124 134 -104 40 11 76 57 76 97 0 36 -27 80 -60 97 -37 19 -57 19 -94 0z"/>
                              <path d="M13665 11705 c-29 -28 -31 -51 -9 -83 20 -29 79 -31 94 -2 12 23 -2 27 -20 5 -18 -21 -37 -19 -54 8 -31 46 14 98 54 62 11 -10 20 -12 24 -6 7 11 -31 41 -52 41 -7 0 -24 -11 -37 -25z"/>
                            </g>
                          </svg>
                        </div>
                        <div className="pricing-card-badge">{tier.name}</div>
                      </div>

                      <div className="pricing-card-sub">luna membership</div>

                      <div className="pricing-card-footer">
                        <div className="pricing-card-price">{tier.priceLabel}</div>
                        <div className="pricing-card-period">{tier.period || '— talk to us'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — slider + what's included */}
          <div>
            <div className="text-[0.72rem] text-text-secondary mb-[0.55rem] font-light">
              Estimate your monthly conversations
            </div>
            <div className="flex items-baseline gap-[0.45rem] mb-[0.15rem]">
              <div className="text-[2.2rem] font-light tracking-[-0.035em] leading-none tabular-nums">
                {formatStopLabel(conversations)}
              </div>
              <div className="text-[0.7rem] text-text-tertiary">conversations / mo</div>
            </div>
            <div className="text-[0.65rem] text-text-tertiary mb-5">
              Matches{' '}
              <span className="text-text-primary">{activeTier.name}</span>
              {' · '}
              <span className="tabular-nums">{activeTier.priceLabel}</span>
              {activeTier.period && <span className="text-text-tertiary">{activeTier.period}</span>}
            </div>

            {/* Stepped slider — thumb snaps to discrete stops */}
            <div className="pricing-slider-wrap">
              <div className="pricing-slider-track-layer">
                {/* tick dots rendered behind the range input */}
                {STOPS.map((_, i) => (
                  <span
                    key={i}
                    className={`pricing-slider-tick ${i <= stopIdx ? 'is-filled' : ''}`}
                    style={{ left: `${(i / (STOPS.length - 1)) * 100}%` }}
                  />
                ))}
                <input
                  type="range"
                  min={0}
                  max={STOPS.length - 1}
                  step={1}
                  value={stopIdx}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="pricing-slider"
                  aria-label="Conversations per month"
                  aria-valuetext={formatStopLabel(conversations)}
                />
              </div>
              <div className="flex justify-between text-[0.55rem] text-text-tertiary uppercase tracking-[0.12em] mt-[0.7rem] tabular-nums">
                <span>50</span>
                <span>5,000+</span>
              </div>
            </div>

            {/* Tier pills — quick switch */}
            <div className="flex gap-[0.4rem] mt-6 flex-wrap">
              {TIERS.map((t, i) => (
                <button
                  key={t.key}
                  onClick={() => handleTierClick(i)}
                  className={`pricing-tier-pill ${displayedIdx === i ? 'is-active' : ''}`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="h-[1px] bg-border my-5" />

            {/* What's included */}
            <div className="text-[0.72rem] text-text-primary font-medium mb-[0.75rem]">
              What&apos;s included in {displayedTier.name}
            </div>
            <ul className="flex flex-col gap-[0.55rem]">
              {[
                { label: 'Conversations / month', val: displayedTier.quotas.conversations },
                { label: 'Products synced from Shopify', val: displayedTier.quotas.products },
                { label: 'Saved answers in Customize', val: displayedTier.quotas.savedAnswers },
                { label: 'Concurrent active issues', val: displayedTier.quotas.activeIssues },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between text-[0.72rem] font-light">
                  <span className="flex items-center gap-[0.55rem] text-text-secondary">
                    <svg className="w-[12px] h-[12px] text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {row.label}
                  </span>
                  <span className="text-text-primary tabular-nums">{row.val}</span>
                </li>
              ))}
            </ul>

            <div className="flex gap-[0.6rem] mt-6">
              <Link
                href="/auth/signup"
                className="bg-btn-bg text-btn-text px-[22px] py-[9px] rounded-[8px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity duration-200"
              >
                {displayedTier.key === 'obsidian' ? 'Talk to us' : 'Start free trial'}
              </Link>
              <Link
                href="/faq"
                className="border border-border text-text-secondary px-[22px] py-[9px] rounded-[8px] text-[0.78rem] hover:border-border-hover hover:text-text-primary transition-all duration-200"
              >
                See FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="max-w-[1080px] mx-auto px-8 pb-16 md:pb-20">
        <div className="text-[0.65rem] uppercase tracking-[0.14em] text-text-tertiary mb-[0.7rem] text-center">
          Full comparison
        </div>
        <h2 className="text-[clamp(1.15rem,2.4vw,1.55rem)] font-light tracking-[-0.025em] leading-[1.2] text-center mb-8 md:mb-10">
          Every tier. Every quota.
        </h2>

        <div className="pricing-table-wrap border border-border rounded-[12px] overflow-hidden">
          <div className="pricing-table">
            {/* Header row */}
            <div className="pricing-table-row pricing-table-header">
              <div className="pricing-table-cell pricing-table-label"></div>
              {TIERS.map((t) => (
                <div key={t.key} className={`pricing-table-cell ${t.featured ? 'is-featured' : ''}`}>
                  <div className="text-[0.78rem] font-medium text-text-primary">{t.name}</div>
                  <div className="text-[0.62rem] text-text-tertiary mt-[2px]">{t.tagline}</div>
                  <div className="text-[0.92rem] font-light tracking-[-0.02em] text-text-primary mt-[0.6rem] tabular-nums">
                    {t.priceLabel}
                    {t.period && <span className="text-[0.58rem] text-text-tertiary ml-[3px]">{t.period}</span>}
                  </div>
                </div>
              ))}
            </div>

            {[
              { label: 'Conversations / month',  key: 'conversations' as const },
              { label: 'Products synced',        key: 'products' as const },
              { label: 'Saved answers (KB)',     key: 'savedAnswers' as const },
              { label: 'Active issues',          key: 'activeIssues' as const },
            ].map((row) => (
              <div key={row.key} className="pricing-table-row">
                <div className="pricing-table-cell pricing-table-label">{row.label}</div>
                {TIERS.map((t) => (
                  <div key={t.key} className={`pricing-table-cell ${t.featured ? 'is-featured' : ''}`}>
                    <span className="text-[0.75rem] text-text-primary tabular-nums">
                      {t.quotas[row.key]}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Feature rows — all tiers equal, shown to reinforce "nothing locked" */}
            {[
              'Instagram DMs',
              'Shopify-native actions',
              'Customize',
              'Tone of voice',
              'Human escalation',
              'Reports & analytics',
            ].map((feat) => (
              <div key={feat} className="pricing-table-row">
                <div className="pricing-table-cell pricing-table-label">{feat}</div>
                {TIERS.map((t) => (
                  <div key={t.key} className={`pricing-table-cell ${t.featured ? 'is-featured' : ''}`}>
                    <svg className="w-[13px] h-[13px] text-text-secondary inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="text-[0.65rem] text-text-tertiary text-center mt-6 font-light">
          All tiers include every feature. Only the quotas change as you scale.
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="text-center border-t border-border py-14 md:py-16 px-8">
        <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1rem]">Early Access</div>
        <h2 className="text-[clamp(1.2rem,2.6vw,1.7rem)] font-light tracking-[-0.025em] leading-[1.2] mx-auto mb-[0.7rem]">
          Start with Bronze.<br />Grow into Obsidian.
        </h2>
        <p className="text-[0.78rem] text-text-secondary leading-[1.75] max-w-[420px] font-light mx-auto mb-6">
          Usage-based. No feature locks. Move between tiers whenever your volume changes.
        </p>
        <div className="flex justify-center gap-[0.7rem] flex-wrap">
          <Link href="/auth/signup" className="bg-btn-bg text-btn-text px-[22px] py-[9px] rounded-[8px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity duration-200">
            Start free trial
          </Link>
          <Link href="/faq" className="border border-border text-text-secondary px-[22px] py-[9px] rounded-[8px] text-[0.78rem] hover:border-border-hover hover:text-text-primary transition-all duration-200">
            Talk to the team
          </Link>
        </div>
      </section>

      <style jsx>{`
        /* ── CARD STACK ── */
        .card-stack {
          position: relative;
          width: min(380px, 100%);
          height: 230px;
          perspective: 1400px;
        }
        .pricing-card {
          position: absolute;
          top: 50%;
          left: 50%;
          width: min(380px, 94%);
          height: 230px;
          border-radius: 18px;
          overflow: hidden;
          transform-origin: center center;
          transition:
            transform 0.6s cubic-bezier(0.2, 0.85, 0.25, 1),
            opacity 0.5s ease;
          box-shadow:
            0 30px 60px rgba(0,0,0,0.22),
            0 10px 20px rgba(0,0,0,0.14),
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 0 -1px 0 rgba(0,0,0,0.25);
        }
        .pricing-card-inner {
          position: relative;
          z-index: 2;
          padding: 1.35rem 1.5rem 1.3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }
        .pricing-card-sheen {
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            radial-gradient(ellipse 80% 60% at 15% 10%, rgba(255,255,255,0.22) 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 90% 95%, rgba(0,0,0,0.25) 0%, transparent 60%);
          mix-blend-mode: screen;
          pointer-events: none;
        }
        .pricing-card-badge {
          font-size: 0.56rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(0,0,0,0.32);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.9);
        }
        .pricing-card-sub {
          font-size: 0.68rem;
          letter-spacing: 0.02em;
          color: rgba(255,255,255,0.68);
          font-weight: 300;
        }
        .pricing-card-footer {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
        }
        .pricing-card-price {
          font-size: 2.2rem;
          font-weight: 300;
          letter-spacing: -0.04em;
          line-height: 1;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.25);
        }
        .pricing-card-period {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.6);
          font-weight: 300;
        }

        /* Metallic gradients */
        .pricing-card-bronze {
          background:
            radial-gradient(circle at 20% 15%, #d6926a 0%, #a46a44 35%, #6e4128 75%, #3a2414 100%);
          color: #fff;
        }
        .pricing-card-silver {
          background:
            radial-gradient(circle at 20% 15%, #f4f6f7 0%, #c7cdd1 38%, #8f979e 75%, #5a6166 100%);
          color: #2a2d30;
        }
        .pricing-card-silver .pricing-card-badge {
          background: rgba(0,0,0,0.25);
          color: #fff;
          border-color: rgba(255,255,255,0.3);
        }
        .pricing-card-silver .pricing-card-sub { color: rgba(32,34,37,0.7); }
        .pricing-card-silver .pricing-card-price { color: #1c1e20; text-shadow: 0 1px 2px rgba(255,255,255,0.3); }
        .pricing-card-silver .pricing-card-period { color: rgba(32,34,37,0.65); }
        .pricing-card-gold {
          background:
            radial-gradient(circle at 22% 15%, #f0d896 0%, #c9a85a 35%, #8a7332 75%, #4d3e16 100%);
          color: #fff;
        }
        .pricing-card-obsidian {
          background:
            radial-gradient(circle at 22% 15%, #3a3a3d 0%, #1d1d1f 40%, #0a0a0b 85%, #000 100%);
          color: #fff;
        }
        .pricing-card-obsidian .pricing-card-sheen {
          background:
            radial-gradient(ellipse 80% 60% at 15% 10%, rgba(255,255,255,0.1) 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 90% 95%, rgba(0,0,0,0.4) 0%, transparent 60%);
        }

        /* ── SLIDER ── */
        .pricing-slider-wrap {
          width: 100%;
        }
        .pricing-slider-track-layer {
          position: relative;
          width: 100%;
          height: 20px;
          display: flex;
          align-items: center;
        }
        .pricing-slider-tick {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--border-md);
          pointer-events: none;
          transition: background 0.2s ease;
        }
        .pricing-slider-tick.is-filled {
          background: var(--text-secondary);
        }
        .pricing-slider {
          position: relative;
          z-index: 2;
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          height: 20px;
          cursor: pointer;
        }
        .pricing-slider::-webkit-slider-runnable-track {
          height: 1px;
          background: var(--border);
          border-radius: 0.5px;
        }
        .pricing-slider::-moz-range-track {
          height: 1px;
          background: var(--border);
          border-radius: 0.5px;
        }
        .pricing-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--bg);
          border: 1.5px solid var(--text-primary);
          margin-top: -8.5px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.18);
          transition: transform 0.15s ease;
          cursor: grab;
        }
        .pricing-slider::-webkit-slider-thumb:hover { transform: scale(1.08); }
        .pricing-slider::-webkit-slider-thumb:active { cursor: grabbing; }
        .pricing-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--bg);
          border: 1.5px solid var(--text-primary);
          box-shadow: 0 2px 6px rgba(0,0,0,0.18);
          cursor: grab;
        }

        /* ── TIER PILLS ── */
        .pricing-tier-pill {
          font-size: 0.66rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1px solid var(--border);
          color: var(--text-tertiary);
          background: transparent;
          transition: all 0.2s ease;
        }
        .pricing-tier-pill:hover {
          border-color: var(--border-md);
          color: var(--text-secondary);
        }
        .pricing-tier-pill.is-active {
          border-color: var(--text-primary);
          color: var(--text-primary);
          background: var(--bg3);
        }

        /* ── COMPARISON TABLE ── */
        .pricing-table {
          display: flex;
          flex-direction: column;
        }
        .pricing-table-row {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr;
          border-bottom: 1px solid var(--border);
        }
        .pricing-table-row:last-child { border-bottom: none; }
        .pricing-table-header {
          background: var(--bg2);
        }
        .pricing-table-cell {
          padding: 0.7rem 1rem;
          text-align: center;
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 300;
        }
        .pricing-table-label {
          text-align: left;
          color: var(--text-tertiary);
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .pricing-table-cell.is-featured {
          background: var(--bg2);
        }
        .pricing-table-header .pricing-table-cell {
          padding: 0.95rem 1rem 0.85rem;
        }
        @media (max-width: 780px) {
          .pricing-table-row { grid-template-columns: 1.3fr 1fr 1fr; }
          .pricing-table-row > *:nth-child(n+4) { display: none; }
        }
      `}</style>
    </div>
  );
}
