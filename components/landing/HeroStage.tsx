'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Agent } from '@/lib/agents';
import { getStageScript } from '@/content/agent-content';
import AgentMascot from '@/components/agents/AgentMascot';

// =============================================================================
// HERO STAGE — the live agent at work: a scripted Telegram thread (phone,
// front) driving the agent's dashboard mock (back), on ONE timeline.
// Script + dashboard strings come from content/agent-content.ts; the two
// "Logged ✓" beats tick the dashboard, landing exactly on the canonical
// EGP 30,000 expenses / EGP 660,000 real net profit. Beat 3 (the analysis)
// never ticks — it's a read moment with a long hold.
//
// Reduced motion: no loop, no typing, no counting — one static scene at the
// final state (all messages visible, chips resolved, dashboard at canon).
// =============================================================================

interface StageState {
  shown: number; // how many chat items are visible
  typing: boolean;
  chip: 'idle' | 'pressed' | 'resolved';
  ticks: number;
  faded: boolean;
}

const INITIAL: StageState = { shown: 0, typing: false, chip: 'idle', ticks: 0, faded: false };
const FINAL: StageState = { shown: 7, typing: false, chip: 'resolved', ticks: 2, faded: false };

// Beat-by-beat timeline (seconds), as approved:
// beat 1 receipt+chips → beat 2 voice note → beat 3 analysis (long hold) → rest
const TIMELINE: { at: number; patch: Partial<StageState> }[] = [
  { at: 0.0, patch: { shown: 1 } },                    // receipt photo
  { at: 0.9, patch: { typing: true } },
  { at: 2.2, patch: { typing: false, shown: 2 } },     // "Which pool?" + chips
  { at: 4.6, patch: { chip: 'pressed' } },             // the tap, shown
  { at: 4.9, patch: { chip: 'resolved' } },
  { at: 5.8, patch: { typing: true } },
  { at: 7.0, patch: { typing: false, shown: 3 } },     // Logged ✓ #1
  { at: 7.4, patch: { ticks: 1 } },                    // DASHBOARD TICK 1
  { at: 10.5, patch: { shown: 4 } },                   // voice note
  { at: 12.0, patch: { typing: true } },
  { at: 13.2, patch: { typing: false, shown: 5 } },    // Logged ✓ #2
  { at: 13.6, patch: { ticks: 2 } },                   // DASHBOARD TICK 2 → canon
  { at: 16.5, patch: { shown: 6 } },                   // "how do we reach 1M?"
  { at: 18.0, patch: { typing: true } },               // longer think
  { at: 19.8, patch: { typing: false, shown: 7 } },    // 4-line analysis, long hold
  { at: 29.0, patch: { faded: true } },                // calm fade
  { at: 29.9, patch: { ...INITIAL, faded: true } },    // silent reset under the fade
];
const CYCLE_S = 34; // 29s active + 5s rest

const EGP = (v: number) => `EGP ${Math.round(v).toLocaleString('en-US')}`;

/** Animates toward `value` with a short rAF count; snaps under reduced motion. */
function TickNumber({ value, instant }: { value: number; instant: boolean }) {
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
    const DUR = 650;
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

const WAVEFORM = [5, 9, 13, 8, 12, 6, 10, 14, 9, 5, 11, 13, 7, 10, 6, 12, 8, 5, 9, 7, 11, 6];

export default function HeroStage({ agent }: { agent: Agent }) {
  const script = getStageScript(agent.slug);
  const reduce = useReducedMotion();
  const [state, setState] = useState<StageState>(INITIAL);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) {
      setState(FINAL);
      return;
    }
    setState(INITIAL);
    const timers = TIMELINE.map((e) =>
      setTimeout(() => setState((s) => ({ ...s, ...e.patch })), e.at * 1000)
    );
    timers.push(setTimeout(() => setCycle((c) => c + 1), CYCLE_S * 1000));
    return () => timers.forEach(clearTimeout);
  }, [reduce, cycle]);

  const { dashboard } = script;
  const loggedSum = dashboard.ticks
    .slice(0, state.ticks)
    .reduce((sum, t) => sum + t.amount, 0);
  const profit = dashboard.profitStart - loggedSum;
  const expenses = dashboard.expensesStart + loggedSum;
  const loggedRows = dashboard.ticks.slice(0, state.ticks);
  const fade = state.faded ? 'hs-faded' : '';

  return (
    <div className="hs-stage relative w-full" aria-hidden="true">

      {/* ── BACK: the agent's dashboard (mirrors the real overview page) ── */}
      <div className="hs-desk absolute bg-background2 border border-border-md rounded-[16px] overflow-hidden flex">
        {/* mini sidebar — Overview / Revenue / Expenses / Capital / Inventory / Reports / Activity */}
        <div className="w-[42px] border-r border-border bg-background flex flex-col items-center py-3 gap-[0.55rem] shrink-0">
          {[
            <><rect key="o1" x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
            <><ellipse key="r" cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6"/><path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3"/></>,
            <><path key="e" d="M9 14l2 2 4-5"/><path d="M6 2h12v20l-2-1.5L14 22l-2-1.5L10 22l-2-1.5L6 22V2z"/></>,
            <><path key="c" d="M3 21h18M4 18h16M6 10v8M10 10v8M14 10v8M18 10v8M12 3L3 8h18l-9-5z"/></>,
            <><path key="i" d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8"/></>,
            <><path key="p" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M9 15h6M9 11h2"/></>,
            <><polyline key="a" points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
          ].map((icon, i) => (
            <div key={i} className={`w-[24px] h-[24px] rounded-[6px] flex items-center justify-center ${i === 0 ? 'bg-background3 text-text-secondary' : 'text-text-tertiary'}`}>
              <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">{icon}</svg>
            </div>
          ))}
        </div>

        {/* main column */}
        <div className={`hs-fade flex-1 min-w-0 p-[0.85rem] flex flex-col gap-[0.6rem] ${fade}`}>
          <div>
            <div className="text-[0.8rem] font-light tracking-[-0.02em] text-text-primary leading-tight">{dashboard.title}</div>
            <div className="text-[0.52rem] text-text-tertiary mt-[1px]">{dashboard.subtitle}</div>
          </div>

          {/* REAL NET PROFIT — the hero card with the accent glow */}
          <div className="relative rounded-[12px] border border-border bg-background overflow-hidden p-[0.75rem]" data-agent={agent.slug}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 65% 110% at 72% 0%, var(--agent-accent-soft), transparent 70%)' }} />
            <div className="relative">
              <div className="text-[0.5rem] uppercase tracking-[0.14em] text-text-tertiary mb-[0.3rem]">{dashboard.profitLabel}</div>
              <div className="text-[1.35rem] font-light tracking-[-0.03em] text-text-primary leading-none">
                <TickNumber value={profit} instant={!!reduce} />
              </div>
              <div className="text-[0.55rem] text-text-tertiary mt-[0.4rem]">
                net revenue {EGP(dashboard.netRevenue)} − expenses <TickNumber value={expenses} instant={!!reduce} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[0.6rem] flex-1 min-h-0">
            {/* RETURN RATE — canon 28% / EGP 224,000 */}
            <div className="rounded-[12px] border border-border bg-background p-[0.7rem] min-w-0">
              <div className="text-[0.5rem] uppercase tracking-[0.14em] text-text-tertiary mb-[0.45rem]">{dashboard.returnRate.label}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-[0.95rem] font-light tracking-[-0.02em] text-text-primary">{dashboard.returnRate.stat}</span>
                <span className="text-[0.48rem] uppercase tracking-[0.08em] text-text-tertiary">of gross</span>
              </div>
              <p className="text-[0.5rem] text-text-secondary leading-[1.55] mt-[0.4rem] font-light">{dashboard.returnRate.line}</p>
            </div>

            {/* WHAT IVY LOGGED — fills up as the ticks land */}
            <div className="rounded-[12px] border border-border bg-background p-[0.7rem] min-w-0 flex flex-col">
              <div className="text-[0.5rem] uppercase tracking-[0.14em] text-text-tertiary mb-[0.45rem]">{dashboard.loggedTitle}</div>
              {loggedRows.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[0.52rem] text-text-tertiary">{dashboard.loggedEmpty}</div>
              ) : (
                <div className="flex flex-col gap-[0.35rem]" data-agent={agent.slug}>
                  {loggedRows.map((row) => (
                    <div key={row.label} className="hs-row flex items-center justify-between gap-2 rounded-[6px] px-[0.35rem] py-[0.3rem] -mx-[0.35rem]">
                      <span className="text-[0.52rem] text-text-secondary truncate">{row.label}</span>
                      <span className="text-[0.52rem] tabular-nums shrink-0" style={{ color: 'var(--agent-accent)' }}>
                        + {EGP(row.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FRONT: the Telegram phone ── */}
      <div className="hs-phone absolute bottom-0 left-0 z-[3] rounded-[26px] overflow-hidden bg-background border border-border-md w-[236px]">
        {/* header */}
        <div className="flex items-center gap-[0.5rem] px-[0.7rem] py-[0.55rem] border-b border-border bg-background2">
          <svg className="w-[13px] h-[13px] text-text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span className="hs-avatar shrink-0"><AgentMascot agent={agent} size={26} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[0.66rem] font-semibold text-text-primary leading-tight">{agent.name}</div>
            <div className="text-[0.5rem] text-text-tertiary">online</div>
          </div>
        </div>

        {/* thread — bottom-anchored; older messages clip above */}
        <div className={`hs-fade h-[330px] px-[0.6rem] py-[0.6rem] flex flex-col justify-end gap-[0.4rem] overflow-hidden ${fade}`} data-agent={agent.slug}>
          {script.chat.slice(0, state.shown).map((item, idx) => {
            switch (item.kind) {
              case 'photo':
                return (
                  <div key={idx} className="hs-in self-end">
                    <div className="hs-bubble-user rounded-[12px] rounded-br-[4px] p-[4px]">
                      {/* receipt attachment mock */}
                      <div className="w-[108px] h-[76px] rounded-[9px] bg-background3 border border-border relative overflow-hidden">
                        <div className="absolute left-[10px] right-[34px] top-[12px] h-[3px] rounded bg-border-md" />
                        <div className="absolute left-[10px] right-[20px] top-[24px] h-[3px] rounded bg-border" />
                        <div className="absolute left-[10px] right-[44px] top-[36px] h-[3px] rounded bg-border" />
                        <div className="absolute left-[10px] right-[28px] top-[48px] h-[3px] rounded bg-border" />
                        <div className="absolute right-[8px] bottom-[6px] text-[0.6rem]">📄</div>
                      </div>
                    </div>
                  </div>
                );
              case 'agent':
                return (
                  <div key={idx} className="hs-in self-start max-w-[85%]">
                    <div className="hs-bubble-agent rounded-[12px] rounded-bl-[4px] px-[0.55rem] py-[0.4rem] text-[0.58rem] leading-[1.5] text-text-primary">
                      {item.text}
                    </div>
                    {item.chips && (
                      <div className="flex gap-[0.3rem] mt-[0.3rem]">
                        {item.chips.map((chip, ci) => {
                          const isChosen = ci === 0;
                          const cls =
                            state.chip === 'idle'
                              ? 'hs-chip'
                              : isChosen
                                ? state.chip === 'pressed'
                                  ? 'hs-chip hs-chip-pressed'
                                  : 'hs-chip hs-chip-chosen'
                                : 'hs-chip hs-chip-dimmed';
                          return (
                            <span key={chip} className={`${cls} flex-1 text-center rounded-[8px] px-[0.4rem] py-[0.3rem] text-[0.54rem] whitespace-nowrap`}>
                              {chip}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              case 'voice':
                return (
                  <div key={idx} className="hs-in self-end max-w-[85%]">
                    <div className="hs-bubble-user rounded-[12px] rounded-br-[4px] px-[0.55rem] py-[0.45rem]">
                      <div className="flex items-center gap-[0.4rem]">
                        <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--agent-accent)' }}>
                          <svg className="w-[8px] h-[8px] text-white ml-[1px]" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </span>
                        <span className="flex items-center gap-[1.5px] h-[16px]">
                          {WAVEFORM.map((h, wi) => (
                            <span key={wi} className="w-[2px] rounded-full" style={{ height: h, background: 'var(--agent-accent)', opacity: 0.75 }} />
                          ))}
                        </span>
                        <span className="text-[0.5rem] text-text-tertiary tabular-nums">{item.duration}</span>
                      </div>
                      <div className="text-[0.56rem] leading-[1.5] text-text-secondary mt-[0.3rem]" dir="rtl" lang="ar">
                        {item.transcript}
                      </div>
                    </div>
                  </div>
                );
              case 'user':
                return (
                  <div key={idx} className="hs-in self-end max-w-[85%]">
                    <div
                      className="hs-bubble-user rounded-[12px] rounded-br-[4px] px-[0.55rem] py-[0.4rem] text-[0.58rem] leading-[1.5] text-text-primary"
                      dir={item.rtl ? 'rtl' : undefined}
                      lang={item.rtl ? 'ar' : undefined}
                    >
                      {item.text}
                    </div>
                  </div>
                );
              case 'analysis':
                return (
                  <div key={idx} className="hs-in self-start max-w-[92%]">
                    <div className="hs-bubble-agent rounded-[12px] rounded-bl-[4px] px-[0.6rem] py-[0.5rem] flex flex-col gap-[0.35rem]">
                      {item.lines.map((line, li) => (
                        <div key={li} className="hs-line text-[0.56rem] leading-[1.55] text-text-primary" style={{ animationDelay: `${li * 0.45}s` }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                );
            }
          })}

          {state.typing && (
            <div className="hs-in self-start">
              <div className="hs-bubble-agent rounded-[12px] rounded-bl-[4px] px-[0.55rem] py-[0.45rem] flex items-center gap-[3px] w-fit">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          )}
        </div>

        {/* input bar */}
        <div className="flex items-center gap-[0.45rem] px-[0.6rem] py-[0.5rem] border-t border-border bg-background2">
          <svg className="w-[14px] h-[14px] text-text-tertiary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          <div className="flex-1 rounded-[14px] border border-border px-[0.55rem] py-[0.25rem] text-[0.54rem] text-text-tertiary">Message</div>
          <svg className="w-[14px] h-[14px] text-text-tertiary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>
        </div>
      </div>

      <style jsx>{`
        .hs-stage {
          height: 560px;
        }
        .hs-desk {
          top: 0;
          left: 48px;
          right: 0;
          height: 430px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.14);
        }
        .hs-phone {
          box-shadow: 0 22px 48px rgba(0, 0, 0, 0.2);
        }
        /* avatar: keep glow breathing + blink, kill the float (too big at 26px) */
        .hs-avatar :global(.agent-mascot svg) {
          animation: none;
        }

        .hs-fade {
          transition: opacity 0.8s ease;
        }
        .hs-faded {
          opacity: 0;
        }

        /* message entrance — small, quiet */
        .hs-in {
          animation: hsIn 0.28s ease both;
        }
        @keyframes hsIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* bubbles — user side carries the agent accent, agent side is surface */
        .hs-bubble-user {
          background: var(--agent-accent-soft);
        }
        .hs-bubble-agent {
          background: var(--bg3);
        }

        /* Telegram-style inline chips */
        .hs-chip {
          border: 1px solid var(--agent-accent);
          color: var(--agent-accent);
          transition: transform 0.15s ease, background 0.15s ease, opacity 0.3s ease;
        }
        .hs-chip-pressed {
          transform: scale(0.94);
          background: var(--agent-accent-soft);
        }
        .hs-chip-chosen {
          background: var(--agent-accent-soft);
        }
        .hs-chip-dimmed {
          opacity: 0.35;
        }

        /* analysis lines assemble one by one inside a single bubble */
        .hs-line {
          animation: hsIn 0.4s ease both;
        }

        /* logged rows flash in with a brief accent wash */
        .hs-row {
          animation: hsRowIn 1.1s ease both;
        }
        @keyframes hsRowIn {
          0% { opacity: 0; transform: translateY(4px); background: var(--agent-accent-soft); }
          45% { opacity: 1; transform: translateY(0); background: var(--agent-accent-soft); }
          100% { background: transparent; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hs-in, .hs-line, .hs-row {
            animation: none;
          }
          .hs-fade {
            transition: none;
          }
        }

        /* one-column hero: stage centered under the copy */
        @media (max-width: 900px) {
          .hs-stage {
            max-width: 560px;
            margin: 0 auto;
          }
        }
        /* small screens: phone only, static */
        @media (max-width: 640px) {
          .hs-stage {
            height: auto;
            display: flex;
            justify-content: center;
          }
          .hs-desk { display: none; }
          .hs-phone {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}
