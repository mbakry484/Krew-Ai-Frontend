'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { getLiveAgent } from '@/lib/agents';
import { getSpotlightContent } from '@/content/agent-content';
import AgentMascot from '@/components/agents/AgentMascot';
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

// Telegram brand mark — a channel logo, same brand-color idiom as the existing
// integrations strip (KREW-DESIGN allows brand marks; agent accent is untouched).
function TelegramGlyph({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        fill="#fff"
        d="M5.6 11.8l11-4.25c.51-.19.96.12.79.9l-1.87 8.82c-.13.6-.5.74-1 .46l-2.77-2.04-1.33 1.28c-.15.15-.28.28-.56.28l.2-2.85 5.16-4.66c.22-.2-.05-.31-.35-.11l-6.38 4.02-2.75-.86c-.6-.19-.61-.6.12-.89z"
      />
    </svg>
  );
}

export default function SpotlightSection() {
  const agent = getLiveAgent();
  const content = getSpotlightContent(agent.slug);
  const reduce = !!useReducedMotion();

  // Split the reply on its own separator so the teammate attribution can carry
  // the accent — substrings only, byte-identical to the COPY.md string.
  const [replyMain, replyAttr] = content.telegram.reply.split(' · ');

  return (
    <section className="spotlight border-t border-border" data-agent={agent.slug}>
      <div className="spotlight-inner">

        {/* ── TRUTH beat — headline flows straight into the collapsing number ── */}
        <div className="beat">
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

          <Reveal className="truth-grid" delay={80}>
            <Wedge wedge={content.wedge} reduce={reduce} />
            <div className="truth-divider" aria-hidden="true" />
            <ReturnDial returns={content.returns} reduce={reduce} />
          </Reveal>
        </div>

        {/* ── CHAT beat — a real Telegram window; a teammate logs, the agent
              confirms and attributes the spend to them ── */}
        <div className="beat">
          <Reveal className="text-center max-w-[500px] mx-auto">
            <h3 className="text-[clamp(1.2rem,2.6vw,1.65rem)] font-light tracking-[-0.02em] leading-[1.25] text-text-primary mb-[0.9rem]">
              {content.telegram.headline}
            </h3>
            <p className="text-[0.8rem] text-text-secondary leading-[1.8] font-light">
              {content.telegram.sub}
            </p>
          </Reveal>

          <Reveal className="chat-wrap" delay={120}>
            {/* channel tag, tied to the window by a short line — where it lives */}
            <div className="chat-channel">
              <span className="chat-channel-chip">
                <TelegramGlyph size={12} />
                Telegram
              </span>
              <span className="chat-channel-line" aria-hidden="true" />
            </div>

            <div className="chat">
              <div className="chat-head">
                <span className="chat-ava">
                  <AgentMascot agent={agent} size={30} />
                </span>
                <div className="chat-id">
                  <div className="chat-name">{agent.name}</div>
                  <div className="chat-status">
                    <span className="chat-status-dot" />
                    online
                  </div>
                </div>
              </div>

              <div className="chat-body">
                {/* the teammate (sender) — right side, with a role badge */}
                <div className="cmsg cmsg-out">
                  <span className="cmsg-ava cmsg-ava-staff">O</span>
                  <div className="cmsg-main">
                    <div className="cmsg-meta">
                      <span className="cmsg-name">Omar</span>
                      <span className="cmsg-badge">{content.telegram.staffBadge}</span>
                    </div>
                    <div className="cbubble cbubble-user" dir="rtl" lang="ar">
                      {content.telegram.staffText}
                    </div>
                  </div>
                </div>

                {/* the agent — left side; confirms and attributes to the teammate */}
                <div className="cmsg cmsg-in">
                  <span className="cmsg-ava">
                    <AgentMascot agent={agent} size={22} animated={false} />
                  </span>
                  <div className="cmsg-main">
                    <div className="cbubble cbubble-agent">
                      {replyMain}
                      {replyAttr && <span className="cbubble-attr"> · {replyAttr}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* input bar — the chrome that says "this is a chat app" */}
              <div className="chat-input">
                <svg className="chat-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                <span className="chat-input-field">Message</span>
                <svg className="chat-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                </svg>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── CLOSER ── */}
        <Reveal className="text-center">
          <p className="text-[clamp(1.1rem,2.4vw,1.5rem)] font-light tracking-[-0.02em] leading-[1.35] text-text-primary max-w-[440px] mx-auto mb-8">
            {content.peek.line}
          </p>
          <div className="flex justify-center">
            <Button href="/auth/signup" variant="primary">
              Start with {agent.name}
            </Button>
          </div>
        </Reveal>
      </div>

      <style jsx>{`
        .spotlight {
          background: var(--bg);
          padding: 8rem 2rem;
        }
        .spotlight-inner {
          max-width: 1040px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 7.5rem;
        }
      `}</style>

      {/* layout + chat styles, scoped by the .spotlight ancestor so they reach
          the Reveal wrappers (rendered by a child component) */}
      <style jsx global>{`
        /* a beat groups a header with its visual, tightly — so nothing floats */
        .spotlight .beat {
          display: flex;
          flex-direction: column;
          gap: 3.25rem;
        }

        /* truth: number dominant, dial supporting */
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

        /* ── Telegram chat window ── */
        .spotlight .chat-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        .spotlight .chat-channel {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .spotlight .chat-channel-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 5px 11px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--bg2);
          font-size: 0.62rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .spotlight .chat-channel-line {
          width: 1px;
          height: 26px;
          background: linear-gradient(to bottom, var(--border), transparent);
        }
        .spotlight .chat {
          width: 100%;
          max-width: 440px;
          border: 1px solid var(--border-md);
          border-radius: 18px;
          background: var(--bg2);
          overflow: hidden;
          box-shadow: 0 22px 48px rgba(0, 0, 0, 0.22);
        }
        .spotlight .chat-head {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.7rem 0.85rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
        }
        .spotlight .chat-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.15;
        }
        .spotlight .chat-status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.6rem;
          color: var(--text-tertiary);
        }
        .spotlight .chat-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #3dbb77;
        }
        .spotlight .chat-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.2rem 1rem;
        }
        .spotlight .cmsg {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          max-width: 90%;
        }
        /* sender on the right (avatar trailing), agent on the left */
        .spotlight .cmsg-out {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .spotlight .cmsg-in {
          align-self: flex-start;
        }
        .spotlight .cmsg-ava {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .spotlight .cmsg-ava-staff {
          background: var(--bg3);
          border: 1px solid var(--border);
          font-size: 0.62rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .spotlight .cmsg-main {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .spotlight .cmsg-out .cmsg-main {
          align-items: flex-end;
        }
        .spotlight .cmsg-in .cmsg-main {
          align-items: flex-start;
        }
        .spotlight .cmsg-meta {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.35rem;
        }
        .spotlight .cmsg-name {
          font-size: 0.66rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .spotlight .cmsg-badge {
          font-size: 0.48rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--agent-accent);
          border: 1px solid var(--agent-accent);
          border-radius: 4px;
          padding: 1px 5px;
          opacity: 0.85;
        }
        .spotlight .cbubble {
          font-size: 0.78rem;
          font-weight: 300;
          line-height: 1.55;
          padding: 0.5rem 0.72rem;
          border-radius: 13px;
          color: var(--text-primary);
        }
        .spotlight .cbubble-user {
          background: var(--agent-accent-soft);
          border-top-right-radius: 4px;
        }
        .spotlight .cbubble-agent {
          background: var(--bg3);
          border-top-left-radius: 4px;
        }
        .spotlight .cbubble-attr {
          color: var(--agent-accent);
          white-space: nowrap;
        }
        .spotlight .chat-input {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.6rem 0.85rem;
          border-top: 1px solid var(--border);
          background: var(--bg);
        }
        .spotlight .chat-input-icon {
          width: 15px;
          height: 15px;
          color: var(--text-tertiary);
          flex-shrink: 0;
        }
        .spotlight .chat-input-field {
          flex: 1;
          padding: 0.32rem 0.7rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          font-size: 0.66rem;
          color: var(--text-tertiary);
        }

        @media (max-width: 820px) {
          .spotlight {
            padding: 6rem 1.4rem;
          }
          .spotlight-inner {
            gap: 6rem;
          }
          .spotlight .beat {
            gap: 2.75rem;
          }
          .spotlight .truth-grid {
            grid-template-columns: 1fr;
            gap: 3.25rem;
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
