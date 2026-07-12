'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import type { Agent } from '@/lib/agents';
import { getLightStageContent } from '@/content/agent-content';
import AgentMascot from '@/components/agents/AgentMascot';

// =============================================================================
// LIGHT-THEME HERO STAGE — a layered composite: an Apple-tablet-style device
// (coded, live) running a replica of the live agent's dashboard overview, with
// the photographed hand + phone (public/hero/hand-device.webp) layered in
// front, bottom-right. The dashboard inside the tablet stays dark-themed (it
// replicates the product), so the screen uses literal §1 dark tokens — same
// precedent as AgentCard's always-dark surface.
//
// Boot sequence (plays ONCE per page load): the screen wakes near-black with
// the mascot centred — wobble, one blink, a glow pulse (~1s) — then the
// dashboard cross-fades in while the mascot shrinks into the header avatar
// slot, as if it becomes the interface. prefers-reduced-motion: no
// performance; the dashboard renders immediately with a static header avatar.
//
// Desktop/tablet only (≥769px). Mobile keeps the dark stage's strip + chat
// variant — the split lives in Hero.tsx.
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

/** Tiny arc gauge — stroke draws to `pct` once the stage is on. */
function Arc({ pct, on, instant, children }: { pct: number; on: boolean; instant: boolean; children: React.ReactNode }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  const offset = on ? C * (1 - pct / 100) : C;
  return (
    <div className="hsl-arc">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="4.5" />
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

export default function HeroStageLight({ agent }: { agent: Agent }) {
  const content = getLightStageContent(agent.slug);
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  // 'boot' = mascot performance on a dark screen · 'on' = dashboard live
  const [phase, setPhase] = useState<'idle' | 'boot' | 'on'>(
    bootedThisLoad ? 'on' : 'idle'
  );
  const started = useRef(false);

  // NOTE: `phase` must NOT be a dep here — flipping idle→boot would run the
  // cleanup and cancel the handoff timer, freezing the screen mid-boot.
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

      {/* ── TABLET ── */}
      <div className="hsl-tablet">
        <div className="hsl-screen">

          {/* boot layer — mascot performance on the dark screen */}
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
                  <AgentMascot agent={agent} size={24} animated={false} />
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
          position: relative;
          width: 100%;
          height: 560px;
        }

        /* ── device ── */
        .hsl-tablet {
          position: absolute;
          top: 34px;
          left: 0;
          right: 8%;
          border-radius: 26px;
          background: #0a0a0a; /* bezel — §1 base as literal (always-dark device) */
          padding: 11px;
          box-shadow:
            0 40px 80px rgba(17, 24, 39, 0.18),
            0 12px 28px rgba(17, 24, 39, 0.10);
        }
        .hsl-screen {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #0a0a0a;
          height: 418px; /* landscape-leaning aspect against the column width */
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
        }
        /* 0–180ms wake · 180–700ms wobble (blink + pulse ride the same window) */
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
        .hsl-boot-mascot {
          transition:
            transform 0.4s ${EASE},
            opacity 0.4s ${EASE};
        }
        .hsl-stage[data-phase='on'] .hsl-boot-mascot {
          opacity: 0;
          transform: translate(38%, -175%) scale(0.22);
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
          transform: scale(0.965);
          transition:
            opacity 0.5s ${EASE} 0.06s,
            transform 0.5s ${EASE} 0.06s;
        }
        .hsl-stage[data-phase='on'] .hsl-dash {
          opacity: 1;
          transform: scale(1);
        }

        /* Always-dark product chrome — §1 tokens as literals (page is light) */
        .hsl-side {
          width: 38px;
          flex-shrink: 0;
          border-right: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 0;
          gap: 7px;
        }
        .hsl-side-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.4);
        }
        .hsl-side-icon.is-active {
          background: #1c1c1f;
          color: rgba(255, 255, 255, 0.65);
        }
        .hsl-side-icon svg {
          width: 11px;
          height: 11px;
        }

        .hsl-main {
          flex: 1;
          min-width: 0;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hsl-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .hsl-title {
          font-size: 0.72rem;
          font-weight: 300;
          letter-spacing: -0.02em;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.2;
        }
        .hsl-subtitle {
          font-size: 0.5rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 1px;
        }
        .hsl-head-ava {
          width: 24px;
          height: 24px;
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
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 11px;
          background: #111113;
          padding: 9px 11px;
          min-width: 0;
        }
        .hsl-label {
          font-size: 0.46rem;
          text-transform: uppercase;
          letter-spacing: 0.11em;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hsl-profit .hsl-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 120% at 78% 0%, var(--agent-accent-soft), transparent 70%);
          pointer-events: none;
        }
        .hsl-profit > :global(*) {
          position: relative;
        }
        .hsl-big {
          font-size: 1.5rem;
          font-weight: 300;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: rgba(255, 255, 255, 0.95);
        }
        .hsl-sub {
          font-size: 0.5rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
        }

        .hsl-row3 {
          display: grid;
          grid-template-columns: 1.15fr 0.9fr 1.15fr;
          gap: 8px;
        }
        .hsl-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          flex: 1;
          min-height: 0;
        }

        .hsl-arc-line {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .hsl-arc {
          position: relative;
          width: 54px;
          height: 54px;
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
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1;
        }
        .hsl-arc-unit {
          font-size: 0.36rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 1px;
        }
        .hsl-line {
          font-size: 0.48rem;
          font-weight: 300;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.65);
          min-width: 0;
        }
        .hsl-mid {
          font-size: 0.95rem;
          font-weight: 300;
          letter-spacing: -0.03em;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.1;
        }
        .hsl-split {
          display: flex;
          height: 4px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(224, 112, 112, 0.55);
          margin: 6px 0 5px;
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
          gap: 6px;
        }
        .hsl-bar-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.5rem;
          margin-bottom: 3px;
        }
        .hsl-bar-meta span:first-child {
          color: rgba(255, 255, 255, 0.65);
        }
        .hsl-bar-meta span:last-child {
          color: rgba(255, 255, 255, 0.95);
        }
        .hsl-bar-track {
          height: 3.5px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
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
          padding: 4.5px 0;
        }
        .hsl-log + .hsl-log {
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }
        .hsl-log-main {
          flex: 1;
          min-width: 0;
        }
        .hsl-log-note {
          display: block;
          font-size: 0.52rem;
          color: rgba(255, 255, 255, 0.95);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hsl-log-meta {
          display: block;
          font-size: 0.44rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 1px;
        }
        .hsl-log-amt {
          font-size: 0.52rem;
          color: rgba(255, 255, 255, 0.95);
          flex-shrink: 0;
        }

        /* ── the hand ── */
        .hsl-hand {
          position: absolute;
          z-index: 5;
          right: -7%;
          bottom: -4%;
          width: 56%;
          max-width: 420px;
          height: auto;
          user-select: none;
          pointer-events: none;
          filter: drop-shadow(0 26px 40px rgba(17, 24, 39, 0.22));
          /* melt the photo's hard wrist crop into the scene */
          -webkit-mask-image: linear-gradient(to bottom, #000 78%, transparent 99%);
          mask-image: linear-gradient(to bottom, #000 78%, transparent 99%);
        }

        @media (max-width: 1100px) {
          .hsl-tablet { right: 8%; }
          .hsl-hand { right: -9%; width: 60%; }
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
