'use client';

import { useEffect, useRef, useState } from 'react';
import { getAgent } from '@/lib/agents';
import AgentMascot from '@/components/agents/AgentMascot';
import { VISION_TODO } from '@/content/vision-copy';

// =============================================================================
// THE TWO-LIST DIPTYCH (/about/vision) — "Founders should build. Agents should
// operate.", shown instead of stated (COPY.md "two-list diptych").
//
// Two coded iOS "Today" screens (the user's PNGs rebuilt as UI so every string
// stays in COPY.md, pixel-crisp, themeable, accessible). The BEFORE screen's
// eight grind tasks strike through top→down on scroll-in; as each is crossed
// off, its owning agent's mascot fades in at the row edge — the handoff, per
// task. Once the list is handled, the AFTER screen (the founder's calm day)
// brightens and rises. Motion is scroll-reveal only (strike + fade + ≤12px
// translate) per KREW-DESIGN §5 — the films remain the page's hero moment.
//
// prefers-reduced-motion: both screens render resolved and static (before all
// crossed off with mascots present, after bright) so the contrast still reads.
// =============================================================================

const STEP_S = 0.22; // stagger between before-items
const STATUS_TIME = '12:51';

function StatusBar() {
  return (
    <div className="ph-status" aria-hidden="true">
      <span className="ph-time">{STATUS_TIME}</span>
      <span className="ph-icons">
        <svg viewBox="0 0 18 12" className="ph-ico" width="17" height="11">
          <rect x="0" y="7" width="3" height="5" rx="1" />
          <rect x="5" y="4.5" width="3" height="7.5" rx="1" />
          <rect x="10" y="2" width="3" height="10" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" opacity="0.35" />
        </svg>
        <svg viewBox="0 0 16 12" className="ph-ico" width="16" height="11">
          <path d="M8 11.2 1 4.4a10 10 0 0 1 14 0Z" opacity="0.35" />
          <path d="M8 11.2 4 7.3a5.6 5.6 0 0 1 8 0Z" />
        </svg>
        <svg viewBox="0 0 26 12" className="ph-ico" width="24" height="11">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" strokeWidth="1" />
          <rect x="2" y="2" width="17" height="8" rx="1.5" />
          <rect x="24" y="4" width="2" height="4" rx="1" />
        </svg>
      </span>
    </div>
  );
}

export default function VisionTodo() {
  const { headline, sub, screenTitle, before, afterSubtitle, after } = VISION_TODO;

  const ref = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  // The "after" screen brightens once the whole before-list has been handled.
  const afterDelay = before.length * STEP_S + 0.5;

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setStarted(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="vt" data-started={started || undefined}>
      <div className="vt-head">
        <h2 className="vt-headline">
          {headline[0]}
          <br />
          {headline[1]}
        </h2>
        <p className="vt-sub">{sub}</p>
      </div>

      <div className="vt-diptych">
        {/* ── BEFORE: the grind, being handed off ── */}
        <div className="phone">
          <span className="ph-island" aria-hidden="true" />
          <StatusBar />
          <div className="ph-body">
            <h3 className="ph-title">{screenTitle}</h3>
            <ul className="ph-list">
              {before.map((item, i) => {
                const agent = getAgent(item.owner);
                return (
                  <li
                    key={item.text}
                    className="todo done"
                    style={{ '--i': i } as React.CSSProperties}
                  >
                    <span
                      className="todo-box"
                      style={{ '--accent': agent.accent.base } as React.CSSProperties}
                    >
                      <svg viewBox="0 0 12 12" className="todo-check" aria-hidden="true">
                        <path d="M2.5 6.2 5 8.6l4.5-5" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="todo-text">
                      {i + 1}. {item.text}
                    </span>
                    <span className="todo-owner" aria-hidden="true">
                      <AgentMascot agent={agent} size={18} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <span className="vt-arrow" aria-hidden="true">→</span>

        {/* ── AFTER: the founder's day, returned ── */}
        <div className="phone phone-after" style={{ '--after-delay': `${afterDelay}s` } as React.CSSProperties}>
          <span className="ph-island" aria-hidden="true" />
          <StatusBar />
          <div className="ph-body">
            <h3 className="ph-title">{screenTitle}</h3>
            <p className="ph-subtitle">{afterSubtitle}</p>
            <ul className="ph-list">
              {after.map((item, i) => (
                <li key={item} className="todo">
                  <span className="todo-box" />
                  <span className="todo-text">
                    {i + 1}. {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .vt {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        .vt-head {
          max-width: 760px;
          margin-bottom: clamp(2.5rem, 5vw, 4rem);
        }
        .vt-headline {
          font-size: clamp(2.2rem, 5vw, 4rem);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1.04;
          color: var(--text-primary);
        }
        .vt-sub {
          margin-top: 1.4rem;
          max-width: 540px;
          font-size: clamp(0.92rem, 1.3vw, 1.1rem);
          font-weight: 300;
          line-height: 1.7;
          color: var(--text-secondary);
        }

        /* ── Diptych ── */
        .vt-diptych {
          display: flex;
          align-items: stretch;
          justify-content: center;
          gap: clamp(1rem, 3vw, 2.4rem);
        }
        .vt-arrow {
          align-self: center;
          flex: none;
          font-size: 1.5rem;
          color: var(--text-tertiary);
          opacity: 0;
          transition: opacity 0.8s ease;
        }
        .vt[data-started] .vt-arrow {
          opacity: 1;
          transition-delay: ${afterDelay - 0.3}s;
        }

        /* ── Phone ── */
        .phone {
          position: relative;
          flex: 1 1 0;
          max-width: 340px;
          border-radius: 40px;
          border: 1px solid var(--border-md);
          background: #050505;
          padding: 0 0 1.4rem;
          overflow: hidden;
          box-shadow: 0 30px 80px -40px rgba(0, 0, 0, 0.9);
        }
        .ph-island {
          position: absolute;
          top: 11px;
          left: 50%;
          transform: translateX(-50%);
          width: 82px;
          height: 24px;
          border-radius: 999px;
          background: #000;
          z-index: 2;
        }
        .ph-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 26px 0;
          color: rgba(255, 255, 255, 0.95);
        }
        .ph-time {
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .ph-icons {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .ph-ico {
          fill: rgba(255, 255, 255, 0.95);
          stroke: rgba(255, 255, 255, 0.95);
        }
        .ph-ico rect[fill='none'] {
          stroke: rgba(255, 255, 255, 0.5);
        }

        .ph-body {
          padding: 1.7rem 1.4rem 0;
        }
        .ph-title {
          font-size: 1.9rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: rgba(255, 255, 255, 0.98);
        }
        .ph-subtitle {
          margin-top: 0.2rem;
          font-size: 0.82rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.5);
        }
        .ph-list {
          margin-top: 1rem;
          list-style: none;
        }

        /* ── Rows ── */
        .todo {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.72rem 0;
          border-top: 0.5px solid rgba(255, 255, 255, 0.09);
        }
        .todo:first-child {
          border-top: none;
        }
        .todo-box {
          flex: none;
          width: 19px;
          height: 19px;
          border-radius: 6px;
          border: 1.5px solid rgba(255, 255, 255, 0.28);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.4s ease, border-color 0.4s ease;
        }
        .todo-check {
          width: 12px;
          height: 12px;
          stroke: #050505;
          opacity: 0;
          transform: scale(0.5);
          transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .todo-text {
          position: relative;
          font-size: 0.92rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.92);
          transition: color 0.5s ease;
        }
        /* the strike line — a pen stroke drawn L→R */
        .todo-text::after {
          content: '';
          position: absolute;
          left: 0;
          top: 52%;
          width: 100%;
          height: 1.5px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .todo-owner {
          margin-left: auto;
          flex: none;
          line-height: 0;
          opacity: 0;
          transform: translateX(6px);
          transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        /* damp the mascot's ±6px idle float at 18px (blink + glow stay alive) */
        .todo-owner :global(.agent-mascot[data-animated='true'] svg) {
          animation: none;
        }

        /* ── BEFORE handoff sequence, staggered by --i ── */
        .vt[data-started] .todo.done .todo-box {
          background: var(--accent);
          border-color: var(--accent);
          transition-delay: calc(var(--i) * ${STEP_S}s);
        }
        .vt[data-started] .todo.done .todo-check {
          opacity: 1;
          transform: scale(1);
          transition-delay: calc(var(--i) * ${STEP_S}s);
        }
        .vt[data-started] .todo.done .todo-text {
          color: rgba(255, 255, 255, 0.34);
          transition-delay: calc(var(--i) * ${STEP_S}s);
        }
        .vt[data-started] .todo.done .todo-text::after {
          transform: scaleX(1);
          transition-delay: calc(var(--i) * ${STEP_S}s);
        }
        .vt[data-started] .todo.done .todo-owner {
          opacity: 1;
          transform: none;
          transition-delay: calc(var(--i) * ${STEP_S}s + 0.15s);
        }

        /* ── AFTER screen brightens after the handoff ── */
        .phone-after {
          opacity: 0.32;
          transform: translateY(12px);
          transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .vt[data-started] .phone-after {
          opacity: 1;
          transform: none;
          transition-delay: var(--after-delay);
        }

        /* ── Mobile: stack; arrow points down ── */
        @media (max-width: 760px) {
          .vt {
            padding: 0 1.4rem;
          }
          .vt-diptych {
            flex-direction: column;
            align-items: center;
          }
          .phone {
            width: 100%;
            max-width: 330px;
            flex: none;
          }
          .vt-arrow {
            transform: rotate(90deg);
          }
        }

        /* ── Reduced motion: resolved + static ── */
        @media (prefers-reduced-motion: reduce) {
          .todo-box,
          .todo-check,
          .todo-text,
          .todo-text::after,
          .todo-owner,
          .phone-after,
          .vt-arrow {
            transition: none !important;
          }
          .vt[data-started] .todo.done .todo-box,
          .vt[data-started] .todo.done .todo-check,
          .vt[data-started] .todo.done .todo-text,
          .vt[data-started] .todo.done .todo-text::after,
          .vt[data-started] .todo.done .todo-owner,
          .vt[data-started] .phone-after,
          .vt[data-started] .vt-arrow {
            transition-delay: 0s !important;
          }
        }
      `}</style>
    </section>
  );
}
