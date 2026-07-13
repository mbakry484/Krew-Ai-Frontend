'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import type { Agent } from '@/lib/agents';
import { getLightStageContent } from '@/content/agent-content';
import AgentMascot from '@/components/agents/AgentMascot';

// =============================================================================
// HERO STAGE COMPOSITE (both themes, desktop) — a layered scene: a wide
// macOS-style app window running a live coded replica of the agent's dashboard
// overview, with the photographed hand + phone (public/hero/hand-device.webp)
// layered in front, right side, like the concept comp. The window bleeds past
// the hero column toward the viewport edge so the dashboard reads wide, with
// its right region intentionally sitting behind the hand.
//
// Theme-responsive: every surface uses the theme tokens, so the window is
// light in light mode and dark in dark mode. Window chrome (traffic lights)
// mirrors real macOS UI — same precedent as the integrations' brand marks.
//
// Boot sequence (plays ONCE per page load): the empty window holds the mascot
// centred — wobble, one blink, a glow pulse (~1s) — then the dashboard
// cross-fades in while the mascot shrinks into the header avatar slot.
// prefers-reduced-motion: no performance; dashboard renders immediately.
//
// Desktop only (≥769px). Mobile keeps the strip + chat variant (HeroStage).
// =============================================================================

const NBSP = String.fromCharCode(0xa0);
const EGP = (v: number) => `EGP${NBSP}${Math.round(v).toLocaleString('en-US')}`;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

// "Plays once per page load" — survives theme-switch remounts.
let bootedThisLoad = false;

/** Eased count-up that runs once when armed; instant under reduced motion. */
function SettleNumber({ value, run, instant }: { value: number; run: boolean; instant: boolean }) {
  const [display, setDisplay] = useState(instant ? value : 0);
  const done = useRef(false);
  useEffect(() => {
    if (!run || done.current) return;
    done.current = true;
    if (instant) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const DUR = 900;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / DUR);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, value, instant]);
  return <span className="tabular-nums">{EGP(display)}</span>;
}

/** Small arc gauge — stroke draws to `pct` once the stage is on. */
function Arc({ pct, on, instant, children }: { pct: number; on: boolean; instant: boolean; children: React.ReactNode }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  const offset = on ? C * (1 - pct / 100) : C;
  return (
    <div className="hsl-arc">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={R} fill="none" stroke="var(--border)" strokeWidth="4.5" />
        <circle
          cx="32" cy="32" r={R} fill="none"
          stroke="var(--agent-accent)" strokeWidth="4.5" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset}
          transform="rotate(-90 32 32)"
          style={{ transition: instant ? 'none' : `stroke-dashoffset 1.1s ${EASE} 0.35s` }}
        />
      </svg>
      <div className="hsl-arc-center">{children}</div>
    </div>
  );
}

const SIDEBAR_ICONS = [
  <><rect key="o1" x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  <><ellipse key="r" cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6"/><path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3"/></>,
  <><path key="e" d="M9 14l2 2 4-5"/><path d="M6 2h12v20l-2-1.5L14 22l-2-1.5L10 22l-2-1.5L6 22V2z"/></>,
  <><path key="c" d="M3 21h18M4 18h16M6 10v8M10 10v8M14 10v8M18 10v8M12 3L3 8h18l-9-5z"/></>,
  <><path key="i" d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8"/></>,
  <><path key="p" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M9 15h6M9 11h2"/></>,
  <><polyline key="a" points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
];

export default function HeroStageComposite({ agent }: { agent: Agent }) {
  const content = getLightStageContent(agent.slug);
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  // 'boot' = mascot performance in the empty window · 'on' = dashboard live
  const [phase, setPhase] = useState<'idle' | 'boot' | 'on'>(
    bootedThisLoad ? 'on' : 'idle'
  );
  const started = useRef(false);

  // NOTE: `phase` must NOT be a dep here — flipping idle→boot would run the
  // cleanup and cancel the handoff timer, freezing the window mid-boot.
  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    if (reduce || bootedThisLoad) {
      bootedThisLoad = true;
      setPhase('on');
      return;
    }
    bootedThisLoad = true;
    setPhase('boot');
    // performance 0–1000ms, then the 1000–1400ms handoff runs on CSS transitions
    const t = setTimeout(() => setPhase('on'), 1000);
    return () => clearTimeout(t);
  }, [inView, reduce]);

  const on = phase === 'on';
  const maxBar = Math.max(...content.breakdown.rows.map((r) => r.amount));

  return (
    <div ref={ref} className="hsl-stage" data-phase={phase} data-agent={agent.slug} aria-hidden="true">

      {/* ── macOS-style app window ── */}
      <div className="hsl-win">
        {/* window chrome — traffic lights (real macOS UI, like brand marks) */}
        <div className="hsl-chrome">
          <span className="hsl-dot" style={{ background: '#FF5F57' }} />
          <span className="hsl-dot" style={{ background: '#FEBC2E' }} />
          <span className="hsl-dot" style={{ background: '#28C840' }} />
        </div>

        <div className="hsl-screen">
          {/* boot layer — mascot performance in the empty window */}
          <div className="hsl-boot">
            <div className="hsl-boot-mascot">
              <AgentMascot agent={agent} size={150} animated={false} />
            </div>
          </div>

          {/* dashboard layer */}
          <div className="hsl-dash">
            {/* icon-only sidebar */}
            <div className="hsl-side">
              {SIDEBAR_ICONS.map((icon, i) => (
                <div key={i} className={`hsl-side-icon ${i === 0 ? 'is-active' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">{icon}</svg>
                </div>
              ))}
            </div>

            <div className="hsl-main">
              {/* header — title left, the mascot's landing slot right */}
              <div className="hsl-head">
                <div>
                  <div className="hsl-title">{content.header.title}</div>
                  <div className="hsl-subtitle">{content.header.subtitle}</div>
                </div>
                <div className="hsl-head-ava">
                  <AgentMascot agent={agent} size={26} animated={false} />
                </div>
              </div>

              {/* hero tile — the one number */}
              <div className="hsl-tile hsl-profit">
                <div className="hsl-glow" />
                <div className="hsl-label">{content.profit.label}</div>
                <div className="hsl-big">
                  <SettleNumber value={content.profit.value} run={on} instant={reduce} />
                </div>
                <div className="hsl-sub">{content.profit.sub}</div>
              </div>

              {/* pulse row */}
              <div className="hsl-row3">
                <div className="hsl-tile">
                  <div className="hsl-label">{content.returnRate.label}</div>
                  <div className="hsl-arc-line">
                    <Arc pct={content.returnRate.percent} on={on} instant={reduce}>
                      <span className="hsl-arc-stat">{content.returnRate.stat}</span>
                      <span className="hsl-arc-unit">{content.returnRate.unit}</span>
                    </Arc>
                    <p className="hsl-line">{content.returnRate.line}</p>
                  </div>
                </div>

                <div className="hsl-tile">
                  <div className="hsl-label">{content.netRevenue.label}</div>
                  <div className="hsl-mid">{EGP(content.netRevenue.value)}</div>
                  <div className="hsl-split">
                    <span style={{ width: on ? `${content.netRevenue.keptPct}%` : '0%' }} />
                  </div>
                  <p className="hsl-line">{content.netRevenue.line}</p>
                </div>

                <div className="hsl-tile">
                  <div className="hsl-label">{content.inventory.label}</div>
                  <div className="hsl-arc-line">
                    <Arc pct={content.inventory.percent} on={on} instant={reduce}>
                      <span className="hsl-arc-stat">{content.inventory.stat}</span>
                      <span className="hsl-arc-unit">{content.inventory.unit}</span>
                    </Arc>
                    <p className="hsl-line">{content.inventory.line}</p>
                  </div>
                </div>
              </div>

              {/* bottom row */}
              <div className="hsl-row2">
                <div className="hsl-tile">
                  <div className="hsl-label">{content.breakdown.label}</div>
                  <div className="hsl-bars">
                    {content.breakdown.rows.map((r) => (
                      <div key={r.name} className="hsl-bar">
                        <div className="hsl-bar-meta">
                          <span>{r.name}</span>
                          <span className="tabular-nums">{EGP(r.amount)}</span>
                        </div>
                        <div className="hsl-bar-track">
                          <span style={{ width: on ? `${(r.amount / maxBar) * 100}%` : '0%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hsl-tile">
                  <div className="hsl-label">{content.logged.label}</div>
                  <div className="hsl-logs">
                    {content.logged.rows.map((r) => (
                      <div key={r.note} className="hsl-log">
                        <div className="hsl-log-main">
                          <span className="hsl-log-note">{r.note}</span>
                          <span className="hsl-log-meta">{r.meta}</span>
                        </div>
                        <span className="hsl-log-amt tabular-nums">−{EGP(r.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HAND + PHONE (photo, in front) ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hsl-hand" src="/hero/hand-device.webp" alt="" draggable={false} />

      <style jsx>{`
        .hsl-stage {
          /* ═══════════════════ CONTROL PANEL ═══════════════════
             Change a number, save, the page refreshes itself.

             WHOLE SCENE — window + hand move/scale TOGETHER:
               --scene-x      +20px moves everything RIGHT · -20px LEFT
               --scene-y      +20px moves everything DOWN  · -20px UP
               --scene-scale  1 = normal · 1.1 = 10% bigger · 0.9 = smaller

             WINDOW only:
               --win-x            nudge: + right · − left
               --win-y            nudge: + down  · − up
               --win-extend-left  stretch the LEFT edge outward (wider)
               --win-extend-right stretch the RIGHT edge outward (wider)
               --win-height       dashboard height in px (shorter/taller)

             HAND only:
               --hand-x     nudge: + right · − left
               --hand-y     nudge: + down  · − up
               --hand-size  size, % of the column (bigger % = bigger hand)
               --hand-fade-start  where the bottom fade BEGINS (% of the
                                  photo's height; lower = starts higher)
               --hand-fade-end    where it's FULLY gone (must be > start;
                                  the gap between them = how soft the fade)
             ══════════════════════════════════════════════════════ */
          --scene-x: 0px;
          --scene-y: 0px;
          --scene-scale: 1;

          --win-x: -100px;
          --win-y: 12px;
          --win-extend-left: 0px;
          --win-extend-right: 130px;
          --win-height: 450px;

          --hand-x: 30px;
          --hand-y: 0px;
          --hand-size: 105%;
          --hand-fade-start: 74%;
          --hand-fade-end: 88%;

          position: relative;
          width: 100%;
          height: 600px;
          transform: translate(var(--scene-x), var(--scene-y)) scale(var(--scene-scale));
          transform-origin: center center;
        }

        /* ── the window — reads the knobs above; theme-token surfaces:
              light window in light mode, dark in dark. ── */
        .hsl-win {
          position: absolute;
          top: 6px;
          left: calc(-1 * var(--win-extend-left));
          right: calc(-1 * var(--win-extend-right));
          transform: translate(var(--win-x), var(--win-y));
          border-radius: 18px;
          border: 1px solid var(--border-md);
          background: var(--bg2);
          overflow: hidden;
          box-shadow:
            0 44px 90px rgba(10, 10, 10, 0.16),
            0 14px 30px rgba(10, 10, 10, 0.08);
        }
        .hsl-chrome {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }
        .hsl-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
        }
        .hsl-screen {
          position: relative;
          height: var(--win-height);
        }

        /* ── boot layer ── */
        .hsl-boot {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .hsl-boot-mascot {
          opacity: 0;
          transform: scale(0.85);
          transition:
            transform 0.4s ${EASE},
            opacity 0.4s ${EASE};
        }
        /* 0–180ms wake · 180–700ms wobble (blink + pulse ride the window) */
        .hsl-stage[data-phase='boot'] .hsl-boot-mascot {
          animation:
            hslWake 0.18s ease-out both,
            hslWobble 0.52s ${EASE} 0.18s both;
        }
        .hsl-stage[data-phase='boot'] .hsl-boot-mascot :global(.eyes) {
          transform-origin: center;
          transform-box: fill-box;
          animation: hslBlink 0.14s linear 0.48s 1;
        }
        .hsl-stage[data-phase='boot'] .hsl-boot-mascot :global(.blob-halo) {
          animation: hslPulse 0.3s ease-in-out 0.7s 1;
        }
        /* 1000–1400ms handoff — shrink + glide toward the header slot */
        .hsl-stage[data-phase='on'] .hsl-boot-mascot {
          opacity: 0;
          transform: translate(40%, -180%) scale(0.22);
        }
        .hsl-stage[data-phase='idle'] .hsl-boot-mascot {
          opacity: 0;
        }
        @keyframes hslWake {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes hslWobble {
          0% { transform: scale(1) rotate(0deg); }
          28% { transform: scale(1.02) rotate(-7deg) translateY(-5px); }
          62% { transform: scale(1.01) rotate(5deg) translateY(3px); }
          100% { transform: scale(1) rotate(0deg) translateY(0); }
        }
        @keyframes hslBlink {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.12); }
        }
        @keyframes hslPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        /* ── dashboard layer ── */
        .hsl-dash {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          opacity: 0;
          transform: scale(0.97);
          transition:
            opacity 0.5s ${EASE} 0.06s,
            transform 0.5s ${EASE} 0.06s;
        }
        .hsl-stage[data-phase='on'] .hsl-dash {
          opacity: 1;
          transform: scale(1);
        }

        .hsl-side {
          width: 46px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 14px 0;
          gap: 9px;
        }
        .hsl-side-icon {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
        }
        .hsl-side-icon.is-active {
          background: var(--bg3);
          color: var(--text-secondary);
        }
        .hsl-side-icon svg {
          width: 13px;
          height: 13px;
        }

        .hsl-main {
          flex: 1;
          min-width: 0;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .hsl-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .hsl-title {
          font-size: 0.85rem;
          font-weight: 300;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .hsl-subtitle {
          font-size: 0.56rem;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .hsl-head-ava {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease 0.32s;
        }
        .hsl-stage[data-phase='on'] .hsl-head-ava {
          opacity: 1;
        }

        .hsl-tile {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--bg);
          padding: 12px 14px;
          min-width: 0;
        }
        .hsl-label {
          font-size: 0.52rem;
          text-transform: uppercase;
          letter-spacing: 0.11em;
          color: var(--text-tertiary);
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hsl-profit .hsl-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 55% 130% at 80% 0%, var(--agent-accent-soft), transparent 70%);
          pointer-events: none;
        }
        .hsl-big {
          font-size: 1.9rem;
          font-weight: 300;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: var(--text-primary);
        }
        .hsl-sub {
          font-size: 0.56rem;
          color: var(--text-tertiary);
          margin-top: 5px;
        }

        .hsl-row3 {
          display: grid;
          grid-template-columns: 1.15fr 0.95fr 1.15fr;
          gap: 10px;
        }
        .hsl-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 1;
          min-height: 0;
        }

        .hsl-arc-line {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .hsl-arc {
          position: relative;
          width: 60px;
          height: 60px;
          flex-shrink: 0;
        }
        .hsl-arc svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .hsl-arc-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .hsl-arc-stat {
          font-size: 0.66rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          line-height: 1;
        }
        .hsl-arc-unit {
          font-size: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-tertiary);
          margin-top: 1px;
        }
        .hsl-line {
          font-size: 0.54rem;
          font-weight: 300;
          line-height: 1.5;
          color: var(--text-secondary);
          min-width: 0;
        }
        .hsl-mid {
          font-size: 1.05rem;
          font-weight: 300;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          line-height: 1.1;
        }
        .hsl-split {
          display: flex;
          height: 4px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(224, 112, 112, 0.55);
          margin: 7px 0 6px;
        }
        .hsl-split span {
          height: 100%;
          border-radius: 999px;
          background: var(--agent-accent);
          box-shadow: 0 0 6px var(--agent-accent-soft);
          transition: width 1s ${EASE} 0.4s;
        }

        .hsl-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hsl-bar-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.56rem;
          margin-bottom: 3px;
        }
        .hsl-bar-meta span:first-child {
          color: var(--text-secondary);
        }
        .hsl-bar-meta span:last-child {
          color: var(--text-primary);
        }
        .hsl-bar-track {
          height: 4px;
          border-radius: 999px;
          background: var(--bg3);
          overflow: hidden;
        }
        .hsl-bar-track span {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--agent-accent-soft), var(--agent-accent));
          transition: width 0.9s ${EASE} 0.45s;
        }

        .hsl-logs {
          display: flex;
          flex-direction: column;
        }
        .hsl-log {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
        }
        .hsl-log + .hsl-log {
          border-top: 1px solid var(--border);
        }
        .hsl-log-main {
          flex: 1;
          min-width: 0;
        }
        .hsl-log-note {
          display: block;
          font-size: 0.58rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hsl-log-meta {
          display: block;
          font-size: 0.48rem;
          color: var(--text-tertiary);
          margin-top: 1px;
        }
        .hsl-log-amt {
          font-size: 0.58rem;
          color: var(--text-primary);
          flex-shrink: 0;
        }

        /* ── the hand — big, right side, wrist bleeding off the bottom like
              the comp; the photo's hard crop melts via the mask.
              THE FOUR KNOBS:
                width      → hand SIZE (% of the hero column)
                max-width  → size cap in px so it stops growing on huge screens
                right      → horizontal position; MORE negative = further right
                bottom     → vertical position; MORE negative = lower ── */
        .hsl-hand {
          position: absolute;
          z-index: 5;
          /* base anchor — prefer the --hand-x / --hand-y knobs for moving */
          right: clamp(-100px, -12vw, -60px);
          bottom: -14%;
          width: var(--hand-size);
          max-width: 700px;
          height: auto;
          transform: translate(var(--hand-x), var(--hand-y));
          user-select: none;
          pointer-events: none;
          filter: drop-shadow(0 30px 46px rgba(10, 10, 10, 0.24));
          /* bottom dissolve — fully transparent by --hand-fade-end, so the
             arm (and its shadow) never crosses the hero's bottom border */
          -webkit-mask-image: linear-gradient(
            to bottom,
            #000 var(--hand-fade-start),
            transparent var(--hand-fade-end)
          );
          mask-image: linear-gradient(
            to bottom,
            #000 var(--hand-fade-start),
            transparent var(--hand-fade-end)
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .hsl-boot { display: none; }
          .hsl-dash,
          .hsl-head-ava,
          .hsl-split span,
          .hsl-bar-track span {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
