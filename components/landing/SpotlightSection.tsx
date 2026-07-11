'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { getLiveAgent } from '@/lib/agents';
import { getSpotlightContent } from '@/content/agent-content';
import Button from '@/components/Button';

// =============================================================================
// SPOTLIGHT SECTION (Phase 2.3) — the live agent's "main character" beat.
// Renders entirely from the registry's live agent + its spotlight content, so
// it rotates by flipping registry state, never by rewriting this file.
//
// The centerpiece is the wedge: one big figure that collapses from the Shopify
// number down to the real number as two deductions reveal. A return-rate dial
// stands beside it as proof, then a short multi-user Telegram recap (the full
// sequence lives in the hero), then a quiet closer.
//
// Motion budget (KREW-DESIGN §5): the page's one hero-grade moment is the crew
// assemble — everything here stays quiet (opacity + ≤16px translate, eased
// counts, a single arc draw). prefers-reduced-motion drops all movement and
// shows the final resolved state.
// =============================================================================

const NBSP = String.fromCharCode(0xa0);
const EGP = (v: number) => `EGP${NBSP}${Math.round(v).toLocaleString('en-US')}`;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** Eases toward `value`; snaps instantly under reduced motion. */
function CountEGP({ value, instant }: { value: number; instant: boolean }) {
  const [display, setDisplay] = useState(value);
  const shownRef = useRef(value);
  useEffect(() => {
    if (instant || shownRef.current === value) {
      shownRef.current = value;
      setDisplay(value);
      return;
    }
    const from = shownRef.current;
    const start = performance.now();
    const DUR = 900;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / DUR);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (value - from) * eased;
      shownRef.current = v;
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, instant]);
  return <span className="tabular-nums">{EGP(display)}</span>;
}

// ── The wedge — collapsing number + staggered deductions ─────────────────────
function Wedge({
  wedge,
  reduce,
}: {
  wedge: ReturnType<typeof getSpotlightContent>['wedge'];
  reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [revealed, setRevealed] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (reduce) {
      setRevealed(wedge.deductions.length);
      setSettled(true);
      return;
    }
    if (!inView) return;
    const timers = [
      setTimeout(() => setRevealed(1), 400),
      setTimeout(() => setRevealed(2), 1400),
      setTimeout(() => setSettled(true), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, wedge.deductions.length]);

  const total =
    wedge.grossAmount -
    wedge.deductions.slice(0, revealed).reduce((s, d) => s + d.amount, 0);

  return (
    <div ref={ref} className="wedge">
      <div className="wedge-label-wrap">
        <span
          key={settled ? 'result' : 'gross'}
          className={`wedge-label ${settled ? 'is-result' : ''}`}
        >
          {settled ? wedge.resultLabel : wedge.grossLabel}
        </span>
      </div>
      <div className={`wedge-figure ${settled ? 'is-result' : ''}`}>
        <CountEGP value={total} instant={reduce} />
      </div>

      <div className="wedge-rows">
        {wedge.deductions.map((d, i) => (
          <div
            key={d.label}
            className={`wedge-row ${revealed > i ? 'is-in' : ''}`}
            style={{ transitionDelay: reduce ? '0ms' : `${i * 80}ms` }}
          >
            <span className="wedge-row-amt tabular-nums">
              {'−'} {EGP(d.amount)}
            </span>
            <span className="wedge-row-label">{d.label}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .wedge {
          display: flex;
          flex-direction: column;
        }
        .wedge-label-wrap {
          min-height: 1rem;
          margin-bottom: 0.85rem;
        }
        .wedge-label {
          display: inline-block;
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          animation: labelIn 0.6s ${EASE} both;
        }
        .wedge-label.is-result {
          color: var(--agent-accent);
        }
        @keyframes labelIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .wedge-figure {
          font-size: clamp(2.5rem, 5.2vw, 3.9rem);
          font-weight: 300;
          letter-spacing: -0.035em;
          line-height: 1;
          color: var(--text-primary);
          transition: color 0.7s ${EASE};
        }
        .wedge-figure.is-result {
          color: var(--agent-accent);
        }
        .wedge-rows {
          margin-top: 2.4rem;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          max-width: 340px;
        }
        .wedge-row {
          display: flex;
          align-items: baseline;
          gap: 0.9rem;
          opacity: 0;
          transform: translateY(10px);
          transition:
            opacity 0.7s ${EASE},
            transform 0.7s ${EASE};
        }
        .wedge-row.is-in {
          opacity: 1;
          transform: none;
        }
        .wedge-row-amt {
          font-size: 0.9rem;
          font-weight: 400;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .wedge-row-label {
          font-size: 0.72rem;
          font-weight: 300;
          line-height: 1.4;
          color: var(--text-tertiary);
        }
        @media (prefers-reduced-motion: reduce) {
          .wedge-label,
          .wedge-row {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

// ── Return-rate dial — the proof for the biggest deduction ───────────────────
function ReturnDial({
  returns,
  reduce,
}: {
  returns: ReturnType<typeof getSpotlightContent>['returns'];
  reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const armed = reduce || inView;

  const R = 54;
  const C = 2 * Math.PI * R;
  const offset = armed ? C * (1 - returns.percent / 100) : C;

  return (
    <div ref={ref} className="dial-card">
      <div className="dial-ring">
        <svg className="dial" viewBox="0 0 128 128" aria-hidden="true">
          <circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke="var(--border)"
            strokeWidth="6"
          />
          <circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke="var(--agent-accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform="rotate(-90 64 64)"
            style={{
              transition: reduce ? 'none' : `stroke-dashoffset 1.2s ${EASE}`,
            }}
          />
        </svg>
        <div className="dial-center">
          <div className="dial-stat">{returns.stat}</div>
          <div className="dial-unit">{returns.unit}</div>
        </div>
      </div>
      <p className="dial-line">{returns.line}</p>

      <style jsx>{`
        .dial-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .dial-ring {
          position: relative;
          width: 128px;
          height: 128px;
        }
        .dial {
          width: 128px;
          height: 128px;
          display: block;
        }
        .dial-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .dial-stat {
          font-size: 1.35rem;
          font-weight: 300;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          line-height: 1;
        }
        .dial-unit {
          margin-top: 0.35rem;
          font-size: 0.55rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-tertiary);
        }
        .dial-line {
          margin-top: 1.5rem;
          max-width: 240px;
          font-size: 0.74rem;
          font-weight: 300;
          line-height: 1.7;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

// ── Reveal — quiet opacity + translate on enter (Apple-slow) ─────────────────
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <div ref={ref} className={`reveal ${inView ? 'is-in' : ''} ${className}`}>
      {children}
      <style jsx>{`
        .reveal {
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.8s ${EASE} ${delay}ms,
            transform 0.8s ${EASE} ${delay}ms;
        }
        .reveal.is-in {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function SpotlightSection() {
  const agent = getLiveAgent();
  const content = getSpotlightContent(agent.slug);
  const reduce = !!useReducedMotion();

  return (
    <section className="spotlight border-t border-border" data-agent={agent.slug}>
      <div className="spotlight-inner">

        {/* Header */}
        <Reveal className="text-center max-w-[620px] mx-auto">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">
            {agent.name} — {agent.role}
          </div>
          <h2 className="text-[clamp(1.4rem,3.2vw,2.1rem)] font-light tracking-[-0.025em] leading-[1.2] text-text-primary mb-[1.1rem]">
            {content.headline}
          </h2>
          <p className="text-[0.82rem] text-text-secondary leading-[1.8] font-light max-w-[440px] mx-auto">
            {content.sub}
          </p>
        </Reveal>

        {/* The truth beat — collapsing number + return dial */}
        <Reveal className="truth-grid" delay={80}>
          <Wedge wedge={content.wedge} reduce={reduce} />
          <div className="truth-divider" aria-hidden="true" />
          <ReturnDial returns={content.returns} reduce={reduce} />
        </Reveal>

        {/* Short multi-user Telegram recap */}
        <div className="recap">
          <Reveal className="text-center max-w-[500px] mx-auto">
            <h3 className="text-[clamp(1.2rem,2.6vw,1.65rem)] font-light tracking-[-0.02em] leading-[1.25] text-text-primary mb-[0.9rem]">
              {content.telegram.headline}
            </h3>
            <p className="text-[0.8rem] text-text-secondary leading-[1.8] font-light">
              {content.telegram.sub}
            </p>
          </Reveal>

          <Reveal className="recap-card" delay={120}>
            <div className="recap-msg recap-staff">
              <span className="recap-badge">{content.telegram.staffBadge}</span>
              <span className="recap-bubble recap-bubble-user" dir="rtl" lang="ar">
                {content.telegram.staffText}
              </span>
            </div>
            <div className="recap-msg recap-agent">
              <span className="recap-bubble recap-bubble-agent">
                {content.telegram.reply}
              </span>
            </div>
          </Reveal>
        </div>

        {/* Closer */}
        <Reveal className="text-center">
          <p className="text-[clamp(1.1rem,2.4vw,1.5rem)] font-light tracking-[-0.02em] leading-[1.35] text-text-primary max-w-[440px] mx-auto mb-8">
            {content.peek.line}
          </p>
          <div className="flex justify-center">
            <Button href="/early-access" variant="primary">
              Start with {agent.name}
            </Button>
          </div>
        </Reveal>
      </div>

      <style jsx>{`
        .spotlight {
          background: var(--bg);
          padding: 11rem 2rem;
        }
        .spotlight-inner {
          max-width: 1040px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 11rem;
        }

        /* Recap block — headline + card stacked with breathing room */
        .recap {
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }
      `}</style>

      {/* layout styles that must reach the Reveal wrappers (global, scoped by
          the .spotlight ancestor) */}
      <style jsx global>{`
        .spotlight .truth-grid {
          display: grid;
          grid-template-columns: 1.5fr 1px 1fr;
          align-items: center;
          gap: 4.5rem;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }
        .spotlight .truth-divider {
          align-self: stretch;
          background: var(--border);
          width: 1px;
        }
        .spotlight .recap-card {
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          padding: 1.6rem 1.5rem;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--bg2);
        }
        .spotlight .recap-msg {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          max-width: 84%;
        }
        .spotlight .recap-staff {
          align-self: flex-end;
          align-items: flex-end;
        }
        .spotlight .recap-agent {
          align-self: flex-start;
          align-items: flex-start;
        }
        .spotlight .recap-badge {
          font-size: 0.5rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 2px 6px;
        }
        .spotlight .recap-bubble {
          font-size: 0.78rem;
          font-weight: 300;
          line-height: 1.55;
          padding: 0.55rem 0.75rem;
          border-radius: 14px;
        }
        .spotlight .recap-bubble-user {
          background: var(--agent-accent-soft);
          color: var(--text-primary);
          border-bottom-right-radius: 5px;
        }
        .spotlight .recap-bubble-agent {
          background: var(--bg3);
          color: var(--text-primary);
          border-bottom-left-radius: 5px;
        }

        @media (max-width: 820px) {
          .spotlight {
            padding: 7rem 1.4rem;
          }
          .spotlight-inner {
            gap: 7rem;
          }
          .spotlight .truth-grid {
            grid-template-columns: 1fr;
            gap: 3.5rem;
            max-width: 420px;
          }
          .spotlight .truth-divider {
            width: 100%;
            height: 1px;
          }
        }
      `}</style>
    </section>
  );
}
