'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { useTheme } from '@/components/ThemeProvider';

// =============================================================================
// INTEGRATIONS — a hexagon hub: Krew at the centre, the platform's real
// channels/tools around it. On scroll the centre blur-fades in first, then the
// siblings emerge from behind it and glide out to their slots (blur + fade,
// centre-out stagger). Brand marks follow the same convention as the old strip
// (their own colours); the agent accent is untouched.
// =============================================================================

// Brand marks — small, recognisable, their own colours.
function KrewMark() {
  return (
    <svg viewBox="665 1125 735 145" className="h-[13px] w-auto text-text-primary" fill="currentColor" aria-hidden="true">
      <g transform="translate(0,2350) scale(0.1,-0.1)">
        <path d="M8005 11988 c-99 -106 -384 -399 -634 -650 l-454 -458 344 0 344 0 200 200 c110 110 207 200 216 200 9 0 23 -8 32 -18 15 -16 17 -45 17 -200 l0 -182 404 0 404 0 242 243 242 242 -183 3 c-114 1 -187 7 -196 13 -37 32 -20 53 352 424 201 201 365 367 365 370 0 3 -152 5 -338 5 l-338 0 -195 -193 c-107 -107 -201 -196 -210 -200 -22 -7 -59 19 -59 42 0 10 72 90 160 178 88 88 160 163 160 167 0 3 -156 6 -347 6 l-348 0 -180 -192z"/>
        <path d="M9882 12148 c-9 -9 -12 -161 -12 -625 0 -595 1 -613 19 -623 28 -15 104 -12 127 4 18 14 19 26 16 204 -3 164 -1 195 13 224 23 44 168 178 194 178 14 0 76 -79 235 -304 119 -167 223 -307 232 -310 24 -9 147 -7 163 3 22 14 9 37 -145 248 -265 363 -342 472 -348 491 -5 15 42 67 235 255 135 132 239 242 237 249 -3 9 -31 14 -93 16 l-88 3 -296 -296 c-163 -162 -304 -295 -313 -295 -26 0 -30 41 -27 306 2 197 0 256 -10 268 -16 19 -121 22 -139 4z"/>
        <path d="M11285 11816 c-65 -21 -97 -41 -151 -96 -29 -29 -57 -49 -63 -46 -6 4 -11 29 -11 56 0 60 -18 80 -70 80 -73 0 -70 19 -70 -464 0 -323 3 -435 12 -444 16 -16 113 -15 126 1 8 9 12 95 12 249 1 250 10 318 48 380 49 79 112 120 205 133 62 9 77 26 77 81 0 83 -25 98 -115 70z"/>
        <path d="M11730 11816 c-181 -32 -311 -171 -347 -371 -24 -140 6 -298 80 -406 81 -121 203 -174 380 -167 86 3 110 8 153 31 91 46 151 112 180 196 18 52 11 68 -35 76 -56 9 -84 -7 -119 -68 -42 -75 -105 -107 -206 -107 -39 1 -88 7 -109 14 -84 31 -149 108 -166 200 -8 41 -6 51 10 67 18 18 38 19 328 19 263 0 310 2 321 15 17 21 8 132 -19 216 -67 212 -241 322 -451 285z m176 -154 c49 -25 100 -80 125 -136 23 -50 23 -60 3 -80 -13 -14 -49 -16 -243 -16 -254 0 -259 1 -247 63 14 75 85 154 165 184 49 18 146 11 197 -15z"/>
        <path d="M12233 11803 c-28 -11 -18 -48 157 -588 32 -99 66 -206 75 -237 22 -79 34 -88 108 -88 34 0 67 4 73 8 16 10 24 40 105 362 65 263 82 311 101 292 4 -4 43 -148 87 -320 44 -172 85 -320 91 -328 19 -22 132 -19 152 4 9 9 50 125 91 257 42 132 101 319 132 415 59 187 61 200 43 218 -18 18 -93 15 -116 -5 -16 -14 -43 -98 -106 -331 -47 -172 -91 -323 -97 -334 -11 -21 -12 -21 -25 -4 -7 10 -20 48 -28 85 -13 56 -104 412 -137 533 -5 20 -16 44 -25 53 -22 22 -116 20 -142 -2 -16 -14 -37 -86 -91 -306 -39 -158 -71 -292 -71 -298 0 -5 -7 -26 -15 -46 -13 -32 -17 -35 -29 -22 -8 8 -30 75 -51 149 -20 74 -45 164 -55 200 -10 36 -33 119 -50 185 -37 139 -50 155 -119 154 -25 0 -52 -3 -58 -6z"/>
      </g>
    </svg>
  );
}

const ICON = 'w-[22px] h-[22px]';

function InstagramMark({ dk }: { dk: boolean }) {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs><linearGradient id="ig-hex" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke={dk ? 'currentColor' : 'url(#ig-hex)'} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4" stroke={dk ? 'currentColor' : 'url(#ig-hex)'} strokeWidth="1.8"/>
      <circle cx="17.5" cy="6.5" r="1.1" fill={dk ? 'currentColor' : 'url(#ig-hex)'}/>
    </svg>
  );
}
function FacebookMark() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="#1877F2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function WhatsAppMark() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 21l1.7-5A8 8 0 1112 20a8 8 0 01-3.9-1L3 21z" stroke="#25D366" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M9 8.5c.2 2.2 2.3 4.3 4.5 4.5.4 0 .8-.3 1-.6.2-.3.5-.4.8-.2l1 .6c.3.2.4.6.2.9-.5.9-1.6 1.2-2.6 1-2.6-.6-4.6-2.6-5.2-5.2-.2-1 .1-2.1 1-2.6.3-.2.7-.1.9.2l.6 1c.2.3.1.6-.2.8-.3.3-.6.7-.6 1.1z" fill="#25D366"/>
    </svg>
  );
}
function TelegramMark() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#229ED9"/>
      <path fill="#fff" d="M5.9 11.7l10-3.86c.46-.17.87.11.72.82l-1.7 8.02c-.12.54-.45.67-.91.42l-2.52-1.86-1.2 1.17c-.14.13-.25.25-.51.25l.18-2.6 4.7-4.24c.2-.18-.05-.28-.32-.1l-5.8 3.66-2.5-.78c-.55-.17-.56-.55.11-.81z"/>
    </svg>
  );
}
function ShopifyMark() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15.5 4.5s-.3-1.5-1.8-1.5c0 0-1.2.1-2.2 1.2" stroke="#96BF48" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M8 7.5l1 12 7.5 1.5 2.5-13.5-3-.5s-.4-2-2-2.5c0 0-1.8-.3-3 1L8 7.5z" stroke="#96BF48" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M10.5 7l.5 11M14 7.5l-1 10.5" stroke="#96BF48" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function BostaMark() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="7" width="20" height="13" rx="2" stroke="#FF6B35" strokeWidth="1.8"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#FF6B35" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 12v3M10.5 13.5h3" stroke="#FF6B35" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export default function IntegrationsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const { theme } = useTheme();
  const dk = theme === 'dark';

  // ring order: 3 left · centre · 3 right. `depth` drives the centre-out
  // stagger and how far each starts, pulled toward the centre.
  const nodes = [
    { key: 'instagram', depth: 3, dir: -1, mark: <InstagramMark dk={dk} /> },
    { key: 'facebook', depth: 2, dir: -1, mark: <FacebookMark /> },
    { key: 'whatsapp', depth: 1, dir: -1, mark: <WhatsAppMark /> },
    { key: 'krew', depth: 0, dir: 0, mark: <KrewMark />, center: true },
    { key: 'telegram', depth: 1, dir: 1, mark: <TelegramMark /> },
    { key: 'shopify', depth: 2, dir: 1, mark: <ShopifyMark /> },
    { key: 'bosta', depth: 3, dir: 1, mark: <BostaMark /> },
  ];

  return (
    <section ref={ref} data-in={inView || undefined} className="integ border-t border-b border-border py-24 px-8">
      <div className="text-[0.62rem] uppercase tracking-[0.14em] text-text-tertiary text-center mb-14">
        Integrates with
      </div>

      <div className="integ-ring">
        {nodes.map((n) => (
          <div
            key={n.key}
            className={`integ-hex ${n.center ? 'is-center' : ''}`}
            style={{
              // pull each node toward the centre at rest; release on reveal
              ['--from-x' as string]: `${n.dir * -n.depth * 34}px`,
              ['--delay' as string]: `${n.depth * 0.11}s`,
            }}
          >
            <div className="integ-hex-inner">{n.mark}</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .integ-ring {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(0.5rem, 2vw, 1.4rem);
          flex-wrap: nowrap;
        }
        .integ-hex {
          flex-shrink: 0;
          width: clamp(52px, 9vw, 84px);
          height: clamp(60px, 10.4vw, 96px);
          opacity: 0;
          transform: translateX(var(--from-x)) scale(0.86);
          filter: blur(9px);
          transition:
            opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) var(--delay),
            transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) var(--delay),
            filter 0.7s cubic-bezier(0.22, 1, 0.36, 1) var(--delay);
        }
        .integ[data-in] .integ-hex {
          opacity: 1;
          transform: translateX(0) scale(1);
          filter: blur(0);
        }
        .integ-hex-inner {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg2);
          border: 1px solid var(--border);
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.16);
        }
        .integ-hex.is-center .integ-hex-inner {
          background: var(--bg3);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
        }
        /* narrow phones — shrink so all seven fit without a scrollbar */
        @media (max-width: 520px) {
          .integ-ring {
            gap: 4px;
          }
          .integ-hex {
            width: clamp(32px, 9.4vw, 44px);
            height: clamp(37px, 10.8vw, 51px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .integ-hex {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
