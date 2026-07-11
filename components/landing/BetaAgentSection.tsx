'use client';

import { useEffect, useRef } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
  easeIn,
  easeOut,
  type MotionValue,
} from 'motion/react';
import { getBetaAgent } from '@/lib/agents';
import { getBetaCopy } from '@/content/agent-content';
import AgentStatusBadge from '@/components/agents/AgentStatusBadge';
import Button from '@/components/Button';

// =============================================================================
// BETA SECTION (Phase 2.4) — the compressed beta-agent beat. The strong
// "overnight inbox wall" theatre (formerly ReliefSection): multilingual DMs
// pile up, pause, drain away, and the payoff line lands — reframed with the
// beta agent's approved copy. Renders from the registry's beta agent, so it
// rotates by launch state, never by editing this file. When there is no beta
// agent, the section renders nothing.
//
// Everything — counter, every card, payoff — derives from ONE master progress
// value [0..1], so the pile and the number can never desync. Monochrome by
// design (surface tokens only); the agent accent shows only on the badge.
// =============================================================================

const DMS = [
  { handle: 'zaynab.nour', msg: 'هي عندكم المقاس الـ L؟', x: -18, rot: -2.5 },
  { handle: 'omar.saleh', msg: 'delivery to Cairo?', x: 14, rot: 1.8 },
  { handle: 'lina.maged', msg: '3andoko el black hoodie?', x: -8, rot: -1.2 },
  { handle: 'sara.rami', msg: "what's the return policy?", x: 22, rot: 2.6 },
  { handle: 'yasmin.k', msg: 'ممكن أغير المقاس؟', x: -24, rot: -3 },
  { handle: 'mohamed.h', msg: 'el order wasal emta?', x: 6, rot: 1 },
  { handle: 'nour.ali', msg: 'is the camo tee restocking?', x: -14, rot: 2.2 },
  { handle: 'farah.adel', msg: 'do you ship to Alex?', x: 18, rot: -1.6 },
  { handle: 'karim.f', msg: 'في خصم على الجاكيت؟', x: -4, rot: 2.8 },
  { handle: 'ahmed.r', msg: 'btw3to talabat l Giza?', x: 12, rot: -2.2 },
  { handle: 'mariam.s', msg: 'size chart please 🙏', x: -20, rot: 1.4 },
  { handle: 'youssef.t', msg: 'can I pay on delivery?', x: 8, rot: -2.8 },
  { handle: 'hana.m', msg: 'هل اللون الأبيض متوفر؟', x: -10, rot: 2 },
  { handle: 'dina.m', msg: 'express shipping available?', x: 16, rot: -1 },
];

const CARD_STEP = 24; // px of vertical offset per card in the pile

// ── Master timeline ──────────────────────────────────────────────────────────
const TOTAL = 6.1; // seconds, played once on scroll-into-view
const PILE_END = 0.53; // 0.00–0.53  cards pile + counter climbs to 140
const HOLD_END = 0.7; //  0.53–0.70  hold at full pile / 140
const CLEAR_END = 0.85; // 0.70–0.85 cards drain + counter falls to 0
//                         0.85–1.00  payoff line settles in

const DELAYS = DMS.reduce<number[]>((acc, _, i) => {
  if (i === 0) {
    acc.push(0);
    return acc;
  }
  acc.push(acc[i - 1] + Math.max(0.3 - i * 0.018, 0.09));
  return acc;
}, []);
const PILE_SECONDS = DELAYS[DELAYS.length - 1] + 0.4;
const IN_WIN = 0.38 / TOTAL;
const OUT_WIN = 0.38 / TOTAL;

function PileCard({
  progress,
  index,
  d,
}: {
  progress: MotionValue<number>;
  index: number;
  d: (typeof DMS)[number];
}) {
  const yBase = index * CARD_STEP;
  const inStart = (DELAYS[index] / PILE_SECONDS) * (PILE_END - IN_WIN);
  const inEnd = inStart + IN_WIN;
  const outStart = HOLD_END + ((DMS.length - 1 - index) * 0.035) / TOTAL;
  const outEnd = outStart + OUT_WIN;

  const opacity = useTransform(progress, [inStart, inEnd, outStart, outEnd], [0, 1, 1, 0]);
  const y = useTransform(
    progress,
    [inStart, inEnd, outStart, outEnd],
    [yBase - 44, yBase, yBase, yBase + 72],
    { ease: [easeOut, easeOut, easeIn] },
  );
  const rotate = useTransform(progress, [inStart, inEnd], [0, d.rot], { ease: easeOut });
  const scale = useTransform(progress, [inStart, inEnd], [0.95, 1], { ease: easeOut });

  return (
    <motion.div
      className="absolute inset-x-0 mx-auto w-full max-w-[360px] flex items-center gap-3 rounded-[14px] bg-background2 border border-border px-4 py-3 text-left"
      style={{
        opacity,
        y,
        rotate,
        scale,
        x: d.x,
        zIndex: index,
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        willChange: 'transform, opacity',
      }}
    >
      <div className="w-[26px] h-[26px] rounded-full bg-background4 flex items-center justify-center text-[0.5rem] font-semibold text-text-secondary shrink-0 uppercase">
        {d.handle.slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[0.66rem] font-medium text-text-primary leading-tight truncate">
          {d.handle}
        </div>
        <div className="text-[0.66rem] text-text-secondary truncate" dir="auto">
          {d.msg}
        </div>
      </div>
      <span className="text-[0.55rem] text-text-tertiary shrink-0">now</span>
    </motion.div>
  );
}

export default function BetaAgentSection() {
  const agent = getBetaAgent();
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.35 });
  const reduceMotion = useReducedMotion();
  const started = useRef(false);

  const progress = useMotionValue(0);

  const counterVal = useTransform(
    progress,
    [0, 0.13, 0.28, 0.42, PILE_END, HOLD_END, CLEAR_END],
    [0, 12, 47, 113, 140, 140, 0],
  );
  const counterText = useTransform(counterVal, (v) => Math.round(v));

  const payoffOpacity = useTransform(progress, [CLEAR_END, 0.97], [0, 1]);
  const payoffY = useTransform(progress, [CLEAR_END, 0.97], [16, 0], { ease: easeOut });
  const payoffBlur = useTransform(progress, [CLEAR_END, 0.97], ['blur(8px)', 'blur(0px)']);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    if (reduceMotion) {
      progress.set(1); // resting state: "0 unread" + payoff line, no theatre
      return;
    }
    const controls = animate(progress, 1, { duration: TOTAL, ease: 'linear' });
    return () => controls.stop();
  }, [inView, reduceMotion, progress]);

  // No beta agent in the registry → nothing to show.
  if (!agent) return null;

  const copy = getBetaCopy(agent.slug);
  // Two-tone payoff: split the approved headline on its sentence break.
  const [payoffLead, payoffTail] = copy.headline.split(/(?<=\.)\s+/);

  return (
    <section
      ref={sectionRef}
      data-agent={agent.slug}
      className="relative overflow-hidden border-t border-border bg-background"
    >
      <div className="max-w-[960px] mx-auto px-8 pt-32 pb-24 md:pt-40 md:pb-28 text-center">

        {/* eyebrow — agent identity + launch badge, from the registry */}
        <div className="flex items-center justify-center gap-3 mb-12 md:mb-14">
          <span className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary">
            {agent.name} — {agent.role}
          </span>
          <AgentStatusBadge agent={agent} />
        </div>

        {/* counter — large anchoring number; stays at 0 in the resting state */}
        <div className="flex items-baseline justify-center gap-3 mb-12 md:mb-16">
          <motion.span className="text-[2.4rem] md:text-[4.6rem] font-light tabular-nums tracking-[-0.045em] text-text-primary leading-none">
            {counterText}
          </motion.span>
          <span className="text-[0.62rem] md:text-[0.7rem] uppercase tracking-[0.12em] text-text-tertiary">
            unread
          </span>
        </div>

        {/* stage — fixed height, constrained pile column; transform/opacity only */}
        <div className="relative mx-auto w-full max-w-[400px] h-[400px]">
          {DMS.map((d, i) => (
            <PileCard key={d.handle} progress={progress} index={i} d={d} />
          ))}

          {/* the payoff line — settles in as the pile finishes draining */}
          <motion.h2
            className="absolute inset-0 flex items-center justify-center text-[clamp(1.8rem,3.6vw,3rem)] font-light tracking-[-0.035em] leading-[1.15] text-text-primary"
            style={{ opacity: payoffOpacity, y: payoffY, filter: payoffBlur }}
          >
            <span>
              {payoffLead}
              {payoffTail && (
                <>
                  <br />
                  <span className="text-text-secondary">{payoffTail}</span>
                </>
              )}
            </span>
          </motion.h2>
        </div>

        {/* sub + CTA — the beta claim, stated plainly */}
        <p className="text-[0.82rem] text-text-secondary leading-[1.8] font-light max-w-[440px] mx-auto mt-16 md:mt-20 mb-8">
          {copy.sub}
        </p>
        <div className="flex justify-center">
          <Button href="/early-access" variant="primary">
            {copy.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
