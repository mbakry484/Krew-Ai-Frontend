'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  animate,
} from 'motion/react';

// =============================================================================
// Landing-only "Features" reel — static marketing, no data, no fetching.
// Built to KREW_FEATURES_REEL_SPEC.md.
//
// Composition rules (Part A): ONE shared node design system across all scenes;
// every scene fills the canvas; the mock is the hero (~62% width); connectors
// are curved SVG paths that draw edge-to-edge; the active tile is a CIRCLE with
// an SVG ring sweeping around it; copy + mock are vertically centered.
//
// Surfaces (Part B): canvas = base surface (bg-background) so nodes
// (bg-background2 + hairline border + soft shadow) read as elevated against it
// — the spec's #0A0A0A canvas / #161616 node relationship. Monochrome by
// default; the only accents are the existing green (success) and red (refund).
//
// Motion DNA (from CLAUDE_CODE_ANIMATION_TIMELINE_ONLY.md): scene wrapper
// opacity/y/blur, ease cubic-bezier(0.22,1,0.36,1); node entrance opacity0→1
// y10→0 scale .98→1 ~0.45s; children stagger 90–130ms. Copy reuses the site's
// existing blur-fade (`hero-blur-in` → heroBlurIn in globals.css).
//
// No new design tokens, no new deps (motion already used by ReliefSection).
// =============================================================================

const EASE = [0.22, 1, 0.36, 1] as const;
const SCENE_DURATION = 5200; // ms — default per-scene time (tunable)
// Per-scene overrides — scenes 1 & 4 have more beats, so they hold longer.
const DURATIONS = [6000, 5200, 5000, 6000, 5400, 5000];

const NODE_SHADOW =
  'shadow-[0_6px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)]';

// Scene wrapper (the doc's default enter/exit).
const sceneVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE } },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.4, ease: EASE } },
};

// Shared node entrance (Part B).
function nodeIn(delay: number, reduce: boolean, pronounced = false) {
  return {
    initial: reduce ? false : { opacity: 0, y: 10, scale: pronounced ? 0.95 : 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: reduce ? { duration: 0 } : { duration: pronounced ? 0.55 : 0.45, delay, ease: EASE },
  };
}

// Desktop/mobile switch for the horizontal flows (Scene 1 & 4).
function useIsWide(query = '(min-width: 860px)') {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setWide(m.matches);
    onChange();
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, [query]);
  return wide;
}

// ── PART B: shared node design system ───────────────────────────────────────
function NodeShell({
  className = '',
  children,
  ...rest
}: React.ComponentProps<typeof motion.div> & { className?: string }) {
  return (
    <motion.div
      className={`bg-background2 border border-border rounded-[16px] ${NODE_SHADOW} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type ChipTone = 'muted' | 'green' | 'red' | 'instagram';
function Chip({ label, dot = false, tone = 'muted' }: { label: string; dot?: boolean; tone?: ChipTone }) {
  const text =
    tone === 'green' ? 'text-[#3dbb77]' : tone === 'red' ? 'text-red-500' : 'text-text-tertiary';
  const dotCls =
    tone === 'green' ? 'bg-[#3dbb77]' : tone === 'red' ? 'bg-red-500' : 'bg-text-tertiary';
  return (
    <span className={`inline-flex items-center gap-[5px] text-[0.5rem] font-medium uppercase tracking-[0.12em] ${text}`}>
      {dot && (
        <span
          className={`w-[5px] h-[5px] rounded-full ${tone === 'instagram' ? '' : dotCls}`}
          style={tone === 'instagram' ? { background: '#c13584' } : undefined}
        />
      )}
      {label}
    </span>
  );
}

// Curved SVG connector that draws in via pathLength. `wide` → horizontal axis.
function Connector({ delay, reduce, wide }: { delay: number; reduce: boolean; wide: boolean }) {
  return (
    <div className={wide ? 'relative w-[34px] h-[44px] self-center shrink-0' : 'relative h-6 w-[44px] my-[1px]'}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d={wide ? 'M0,50 C40,50 60,50 100,50' : 'M50,0 C50,40 50,60 50,100'}
          fill="none"
          stroke="var(--border-hover)"
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reduce ? { duration: 0 } : { duration: 0.4, delay, ease: EASE }}
        />
      </svg>
    </div>
  );
}

// Luna sparkle mark.
const LunaMark = ({ className = 'w-[20px] h-[20px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — Order Creation (lead). 4-node L→R flow: DM → Luna → Shopify → Order.
// ─────────────────────────────────────────────────────────────────────────────
function OrderFlowScene({ reduce }: { reduce: boolean }) {
  const wide = useIsWide();
  return (
    <div className={`flex ${wide ? 'flex-row justify-center' : 'flex-col'} items-center w-full`}>
      {/* (a) DM node */}
      <NodeShell {...nodeIn(0, reduce)} className="shrink-0 w-[150px] p-[0.7rem]">
        <Chip label="Instagram DM" dot tone="instagram" />
        <p className="mt-[7px] text-[0.66rem] text-text-primary leading-[1.45]">
          I&apos;ll take the linen set in beige, size M
        </p>
      </NodeShell>

      <Connector delay={0.5} reduce={reduce} wide={wide} />

      {/* (b) Luna node — circular mark + processing pulse */}
      <NodeShell {...nodeIn(0.9, reduce)} className="shrink-0 w-[92px] px-2 py-[0.7rem] flex flex-col items-center gap-[7px]">
        <div className="relative w-[34px] h-[34px] rounded-full bg-btn-bg text-btn-text flex items-center justify-center">
          <LunaMark className="w-[16px] h-[16px]" />
          {!reduce && (
            <motion.span
              className="absolute inset-0 rounded-full border border-text-primary"
              animate={{ scale: [1, 1.35], opacity: [0.4, 0] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </div>
        <Chip label="Luna" />
      </NodeShell>

      <Connector delay={1.4} reduce={reduce} wide={wide} />

      {/* (c) Shopify node — same surface, not a bare icon */}
      <NodeShell {...nodeIn(1.8, reduce)} className="shrink-0 w-[92px] px-2 py-[0.7rem] flex flex-col items-center gap-[7px]">
        <div className="w-[34px] h-[34px] rounded-full bg-background3 border border-border flex items-center justify-center">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M15.5 4.5s-.3-1.5-1.8-1.5c0 0-1.2.1-2.2 1.2" strokeLinecap="round" />
            <path d="M8 7.5l1 12 7.5 1.5 2.5-13.5-3-.5s-.4-2-2-2.5c0 0-1.8-.3-3 1L8 7.5z" />
            <path d="M10.5 7l.5 11M14 7.5l-1 10.5" strokeLinecap="round" />
          </svg>
        </div>
        <Chip label="Shopify" />
      </NodeShell>

      <Connector delay={2.3} reduce={reduce} wide={wide} />

      {/* (d) Order card — the payoff, slightly larger */}
      <NodeShell {...nodeIn(2.7, reduce, true)} className="shrink-0 w-[178px] overflow-hidden">
        <div className="flex items-center justify-between px-[0.8rem] py-[0.55rem] border-b border-border">
          <span className="text-[0.6rem] font-medium text-text-primary tabular-nums">Order #2287</span>
          <Chip label="Shopify" dot tone="green" />
        </div>
        <div className="px-[0.8rem] py-[0.6rem]">
          <div className="text-[0.64rem] font-medium text-text-primary leading-tight">Linen Coord Set — Beige</div>
          <div className="text-[0.55rem] text-text-tertiary mt-[3px]">Size M · Qty 1</div>
          <div className="text-[0.7rem] tabular-nums text-text-primary mt-[7px]">EGP 1,450</div>
        </div>
        <motion.div
          className="px-[0.8rem] py-[0.5rem] border-t border-border"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 3.1 }}
        >
          <Chip label="Created automatically" dot tone="green" />
        </motion.div>
      </NodeShell>
    </div>
  );
}

// ── SCENE 2 — Exchanges & Refunds: pending pile cleared in one tap. ──────────
function ExchangeScene({ reduce }: { reduce: boolean }) {
  const rows = [
    { name: 'lina.maged', sub: 'Exchange · size L', tone: 'muted' as ChipTone },
    { name: 'sara.rami', sub: 'Refund · order #2241', tone: 'muted' as ChipTone },
    { name: 'nour.ali', sub: 'هل اللون متوفر؟ · FAQ', sub_rtl: true, tone: 'muted' as ChipTone },
  ];
  return (
    <NodeShell {...nodeIn(0, reduce)} className="w-full max-w-[460px] mx-auto overflow-hidden">
      <div className="flex items-center justify-between px-[1rem] py-[0.7rem] border-b border-border">
        <Chip label="Requests" />
        <motion.span
          className="text-[0.62rem] font-medium text-btn-text bg-btn-bg rounded-full px-[13px] py-[5px]"
          initial={reduce ? false : { scale: 1 }}
          animate={reduce ? {} : { scale: [1, 0.94, 1] }}
          transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 1.2, ease: EASE }}
        >
          Approve all
        </motion.span>
      </div>
      <ul className="list-none">
        {rows.map((r, i) => (
          <motion.li
            key={r.name}
            className="flex items-center gap-[0.7rem] px-[1rem] py-[0.7rem] border-b border-border last:border-b-0"
            initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.45, delay: 0.1 + i * 0.18, ease: EASE }}
          >
            <div className="w-[28px] h-[28px] rounded-full bg-background4 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[0.68rem] font-medium text-text-primary truncate">{r.name}</div>
              <div className={`text-[0.56rem] text-text-tertiary truncate ${r.sub_rtl ? 'text-right' : ''}`} dir={r.sub_rtl ? 'rtl' : 'ltr'}>
                {r.sub}
              </div>
            </div>
            <div className="relative w-[62px] h-[16px] shrink-0">
              <motion.span
                className="absolute inset-0 flex items-center justify-end"
                initial={reduce ? false : { opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 1.4 + i * 0.3 }}
              >
                <Chip label="Pending" />
              </motion.span>
              <motion.span
                className="absolute inset-0 flex items-center justify-end gap-[4px] text-[0.5rem] font-medium uppercase tracking-[0.12em] text-[#3dbb77]"
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduce ? { duration: 0 } : { duration: 0.35, delay: 1.5 + i * 0.3, ease: EASE }}
              >
                <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Done
              </motion.span>
            </div>
          </motion.li>
        ))}
      </ul>
    </NodeShell>
  );
}

// ── SCENE 3 — Policy FAQs: instant confident answer. ────────────────────────
function FaqScene({ reduce }: { reduce: boolean }) {
  return (
    <div className="w-full max-w-[440px] mx-auto flex flex-col gap-3">
      <NodeShell {...nodeIn(0.1, reduce)} className="self-start max-w-[82%] px-[0.8rem] py-[0.6rem] !rounded-[14px] !rounded-bl-[5px]">
        <p className="text-[0.74rem] text-text-primary leading-[1.5]">When does the Classic Jacket restock?</p>
      </NodeShell>

      {!reduce && (
        <motion.div
          className={`self-end flex items-center gap-[4px] bg-background2 border border-border px-[0.7rem] py-[0.55rem] rounded-[14px] rounded-br-[5px] ${NODE_SHADOW}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.0, times: [0, 0.25, 0.75, 1], delay: 0.7 }}
        >
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </motion.div>
      )}

      <NodeShell {...nodeIn(1.6, reduce, true)} className="self-end max-w-[84%] px-[0.85rem] py-[0.6rem] !rounded-[14px] !rounded-br-[5px]">
        <div className="mb-[5px]"><Chip label="Luna" dot tone="green" /></div>
        <p className="text-[0.74rem] text-text-primary leading-[1.5]">
          Back next week — I&apos;ll save your size if you&apos;d like 🙌
        </p>
      </NodeShell>

      <motion.div
        className="self-end"
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 2.2 }}
      >
        <Chip label="Replied in 0.4s" dot tone="green" />
      </motion.div>
    </div>
  );
}

// ── SCENE 4 — Multilingual: any language in → one Luna out (convergence). ────
function MultilingualScene({ reduce }: { reduce: boolean }) {
  const wide = useIsWide();
  const qs = [
    { t: 'Where is my order?', rtl: false },
    { t: 'فين طلبي؟', rtl: true },
    { t: 'Feen 6alabi?', rtl: false },
  ];

  if (!wide) {
    // mobile: vertical stack → converge downward into the reply
    return (
      <div className="w-full max-w-[360px] mx-auto flex flex-col items-stretch gap-2">
        {qs.map((q, i) => (
          <NodeShell
            key={q.t}
            {...nodeIn(0 + i * 0.25, reduce)}
            className="self-start max-w-[80%] px-[0.75rem] py-[0.5rem] !rounded-[14px]"
          >
            <p dir={q.rtl ? 'rtl' : 'ltr'} className={`text-[0.72rem] text-text-primary leading-[1.45] ${q.rtl ? 'text-right' : ''}`}>{q.t}</p>
          </NodeShell>
        ))}
        <div className="relative h-6 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path d="M50,0 C50,40 50,60 50,100" fill="none" stroke="var(--border-hover)" strokeWidth={2} vectorEffect="non-scaling-stroke"
              initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 1.1 }} />
          </svg>
        </div>
        <NodeShell {...nodeIn(1.6, reduce, true)} className="self-end max-w-[86%] px-[0.85rem] py-[0.6rem] !rounded-[14px] !rounded-br-[5px]">
          <div className="mb-[5px]"><Chip label="Luna" dot tone="green" /></div>
          <p className="text-[0.73rem] text-text-primary leading-[1.5]">On its way! 📦 Out for delivery today.</p>
        </NodeShell>
      </div>
    );
  }

  // desktop: 3 equal-width bubbles (left) converge into the Luna reply (right).
  // Bubbles span x 3%→45%, Luna spans x 55%→97%; connectors run from the bubble
  // right edge (x=45) into the Luna node's left-edge center (x=55, y=50).
  const centers = [22, 50, 78];
  return (
    <div className="relative w-full max-w-[540px] mx-auto h-[270px]">
      {/* convergence connectors — even curves into Luna's left edge */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {centers.map((y, i) => (
          <motion.path
            key={y}
            d={`M45,${y} C51,${y} 51,50 55,50`}
            fill="none"
            stroke="var(--border-hover)"
            strokeWidth={1.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 1.1 + i * 0.08, ease: EASE }}
          />
        ))}
      </svg>

      {/* three question bubbles — equal width, vertically centered via wrapper */}
      {qs.map((q, i) => (
        <div key={q.t} className="absolute left-[3%] w-[42%]" style={{ top: `${centers[i]}%`, transform: 'translateY(-50%)' }}>
          <NodeShell {...nodeIn(i * 0.25, reduce)} className="w-full px-[0.7rem] py-[0.5rem] !rounded-[14px]">
            <p dir={q.rtl ? 'rtl' : 'ltr'} className={`text-[0.7rem] text-text-primary leading-[1.4] truncate ${q.rtl ? 'text-right' : ''}`}>{q.t}</p>
          </NodeShell>
        </div>
      ))}

      {/* Luna reply (payoff) — left edge at x=55%, vertically centered */}
      <div className="absolute right-[3%] w-[42%]" style={{ top: '50%', transform: 'translateY(-50%)' }}>
        <NodeShell {...nodeIn(1.6, reduce, true)} className="w-full px-[0.85rem] py-[0.65rem] !rounded-[16px]">
          <div className="mb-[6px] flex items-center gap-[6px]">
            <span className="w-[20px] h-[20px] rounded-full bg-btn-bg text-btn-text flex items-center justify-center"><LunaMark className="w-[11px] h-[11px]" /></span>
            <Chip label="Luna" dot tone="green" />
          </div>
          <p className="text-[0.72rem] text-text-primary leading-[1.5]">On its way! 📦 Out for delivery today.</p>
        </NodeShell>
      </div>
    </div>
  );
}

// ── SCENE 5 — Customize & Insights: what you teach → what she says. ──────────
function KnowledgeScene({ reduce }: { reduce: boolean }) {
  const wide = useIsWide();
  const lines = ['Free shipping over 500 EGP', 'Classic Jacket restocks next week'];
  const Knowledge = (
    <div className="flex flex-col gap-2 w-full">
      <div className="mb-[2px]"><Chip label="What you teach" /></div>
      {lines.map((l, i) => (
        <NodeShell
          key={l}
          initial={reduce ? false : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.42, delay: 0.15 + i * 0.18, ease: EASE }}
          className="flex items-center gap-[0.55rem] px-[0.75rem] py-[0.5rem] !rounded-[12px]"
        >
          <span className="w-[5px] h-[5px] rounded-full bg-text-tertiary shrink-0" />
          <span className="text-[0.66rem] text-text-secondary leading-tight">{l}</span>
        </NodeShell>
      ))}
    </div>
  );
  const Reply = (
    <NodeShell {...nodeIn(1.6, reduce, true)} className="w-full px-[0.85rem] py-[0.65rem] !rounded-[16px]">
      <div className="mb-[6px]"><Chip label="Luna" dot tone="green" /></div>
      <p className="text-[0.72rem] text-text-primary leading-[1.5]">
        Shipping&apos;s free over 500 EGP ✨ And the Classic Jacket restocks next week — want me to set one aside?
      </p>
      <motion.div
        className="mt-[8px] pt-[7px] border-t border-border"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 2.4 }}
      >
        <Chip label="87% resolved automatically" dot tone="green" />
      </motion.div>
    </NodeShell>
  );

  if (!wide) {
    return (
      <div className="w-full max-w-[360px] mx-auto flex flex-col gap-3">
        {Knowledge}
        <div className="relative h-5 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path d="M50,0 C50,40 50,60 50,100" fill="none" stroke="var(--border-hover)" strokeWidth={2} vectorEffect="non-scaling-stroke"
              initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 1.2 }} />
          </svg>
        </div>
        {Reply}
      </div>
    );
  }
  return (
    <div className="relative grid grid-cols-[1fr_auto_1.05fr] items-center gap-2 w-full">
      <div>{Knowledge}</div>
      {/* horizontal pulse/connector */}
      <div className="relative w-[42px] h-[40px]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path d="M0,50 C40,50 60,50 100,50" fill="none" stroke="var(--border-hover)" strokeWidth={2} vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 1.2, ease: EASE }} />
        </svg>
        {!reduce && (
          <motion.span
            className="absolute top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-text-primary"
            initial={{ left: '0%', opacity: 0 }}
            animate={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, delay: 1.25, ease: EASE }}
          />
        )}
      </div>
      <div>{Reply}</div>
    </div>
  );
}

// ── SCENE 6 — Human Escalation: clean handoff. ──────────────────────────────
function EscalationScene({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative w-full max-w-[440px] mx-auto h-[220px]">
      {/* prior context */}
      <NodeShell
        {...nodeIn(0, reduce)}
        className="absolute top-0 left-0 max-w-[70%] px-[0.8rem] py-[0.5rem] !rounded-[14px] !rounded-bl-[5px]"
      >
        <p className="text-[0.68rem] text-text-secondary leading-[1.45]">Hi, I need to change my delivery address.</p>
      </NodeShell>

      {/* Luna — steps back */}
      <motion.div
        className={`absolute top-[58px] left-[4%] right-[20%] bg-background2 border border-border rounded-[14px] rounded-bl-[5px] px-[0.85rem] py-[0.6rem] ${NODE_SHADOW}`}
        initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
        animate={
          reduce
            ? { opacity: 0.45, scale: 0.96 }
            : { opacity: [0, 1, 1, 0.4], y: [10, 0, 0, 5], scale: [0.98, 1, 1, 0.96] }
        }
        transition={reduce ? { duration: 0 } : { duration: 1.6, times: [0, 0.25, 0.62, 1], delay: 0.3, ease: EASE }}
      >
        <div className="mb-[4px]"><Chip label="Luna" /></div>
        <p className="text-[0.7rem] text-text-secondary leading-[1.5]">Let me pass you to the team — they&apos;ll help right away.</p>
      </motion.div>

      {/* Human teammate — slides in over */}
      <motion.div
        className={`absolute top-[128px] left-[20%] right-[2%] bg-background2 border border-border-md rounded-[14px] rounded-br-[5px] px-[0.85rem] py-[0.6rem] z-10 ${NODE_SHADOW}`}
        initial={reduce ? false : { opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.55, delay: 1.4, ease: EASE }}
      >
        <div className="mb-[4px] flex items-center gap-[6px]">
          <span className="w-[16px] h-[16px] rounded-full bg-background4 flex items-center justify-center text-[0.42rem] font-bold text-text-secondary">YT</span>
          <span className="inline-flex items-center gap-[5px] text-[0.5rem] font-medium uppercase tracking-[0.12em] text-text-tertiary">
            <motion.span
              className="w-[5px] h-[5px] rounded-full bg-[#3dbb77]"
              animate={reduce ? {} : { opacity: [1, 0.3, 1] }}
              transition={reduce ? {} : { duration: 1.6, repeat: Infinity, delay: 1.9 }}
            />
            Your teammate
          </span>
        </div>
        <p className="text-[0.7rem] text-text-primary leading-[1.5]">Hi! I&apos;ve got the full thread — happy to help from here.</p>
      </motion.div>
    </div>
  );
}

type Tab = {
  id: string;
  icon: React.ReactNode;
  label: string;
  headline: string;
  body: string;
  Scene: (p: { reduce: boolean }) => React.ReactNode;
};

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const TABS: Tab[] = [
  {
    id: 'orders',
    label: 'Order Creation',
    headline: 'Order Creation',
    body: 'Takes orders straight from DMs and creates them in Shopify automatically — no manual entry, zero missed sales.',
    icon: (
      <svg className="w-[18px] h-[18px]" {...iconProps}>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <path d="M3 6h18M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    Scene: OrderFlowScene,
  },
  {
    id: 'exchanges',
    label: 'Exchanges & Refunds',
    headline: 'Exchanges & Refunds',
    body: 'Every exchange and refund request, collected in one place — you approve with one tap.',
    icon: (
      <svg className="w-[18px] h-[18px]" {...iconProps}>
        <path d="M17 1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
    ),
    Scene: ExchangeScene,
  },
  {
    id: 'faqs',
    label: 'Policy FAQs',
    headline: 'Policy FAQs',
    body: 'Restocks, sizing, shipping — Luna answers instantly, every time.',
    icon: (
      <svg className="w-[18px] h-[18px]" {...iconProps}>
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        <path d="M9.5 9a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 3.5M12 16h.01" />
      </svg>
    ),
    Scene: FaqScene,
  },
  {
    id: 'multilingual',
    label: 'Multilingual',
    headline: 'Multilingual',
    body: 'English, Arabic, or Franco Arabic — Luna understands every customer and replies in their language, automatically.',
    icon: (
      <svg className="w-[18px] h-[18px]" {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10 15 15 0 014-10z" />
      </svg>
    ),
    Scene: MultilingualScene,
  },
  {
    id: 'insights',
    label: 'Customize & Insights',
    headline: 'Customize & Insights',
    body: 'Tell Luna what to know and she uses it in every conversation — then tells you how your store is performing.',
    icon: (
      <svg className="w-[18px] h-[18px]" {...iconProps}>
        <path d="M3 3v18h18" />
        <path d="M7 14l3-3 3 3 5-6" />
      </svg>
    ),
    Scene: KnowledgeScene,
  },
  {
    id: 'escalation',
    label: 'Human Escalation',
    headline: 'Human Escalation',
    body: 'Luna knows when to step back. Your team picks up exactly where she left off.',
    icon: (
      <svg className="w-[18px] h-[18px]" {...iconProps}>
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    ),
    Scene: EscalationScene,
  },
];

export default function FeaturesSection() {
  const reduce = !!useReducedMotion();
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const progress = useMotionValue(0);

  const playing = !reduce && !manualPaused && !hovered;
  const duration = DURATIONS[active] ?? SCENE_DURATION;

  // Reset the ring on scene change — full ring when paused/static marks selected.
  useEffect(() => {
    if (reduce) { progress.set(1); return; }
    if (!manualPaused) progress.set(0);
  }, [active, reduce, manualPaused, progress]);

  // Autoplay: sweep the ring (progress 0→1) over the scene's remaining time, then
  // advance. Hover freezes mid-sweep; resuming continues from there.
  useEffect(() => {
    if (!playing) return;
    const remaining = (1 - progress.get()) * (duration / 1000);
    const controls = animate(progress, 1, {
      duration: remaining,
      ease: 'linear',
      onComplete: () => setActive((a) => (a + 1) % TABS.length),
    });
    return () => controls.stop();
  }, [active, playing, duration, progress]);

  const jumpTo = (i: number) => {
    setActive(i);
    setManualPaused(true);
    progress.set(1);
  };

  const onTabKeyDown = (e: React.KeyboardEvent, i: number) => {
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    jumpTo(next);
    tabRefs.current[next]?.focus();
  };

  const current = TABS[active];

  const SceneInner = ({ t }: { t: Tab }) => (
    <div className="grid features-panel-grid gap-8 lg:gap-10 items-center w-full h-full">
      {/* copy — LEFT ~38%, vertically centered, existing hero blur-fade */}
      <div className="flex flex-col justify-center">
        <h3
          className={`${reduce ? '' : 'hero-blur-in'} text-[clamp(1.5rem,3.2vw,2.05rem)] font-light tracking-[-0.03em] leading-[1.15] text-text-primary mb-[0.9rem]`}
          style={reduce ? undefined : { animationDelay: '0ms' }}
        >
          {t.headline}
        </h3>
        <p
          className={`${reduce ? '' : 'hero-blur-in'} text-[0.9rem] text-text-secondary leading-[1.8] font-light max-w-[340px]`}
          style={reduce ? undefined : { animationDelay: '120ms' }}
        >
          {t.body}
        </p>
      </div>
      {/* mock — CENTER/RIGHT ~62%, the hero of the canvas, vertically centered */}
      <div className="flex items-center justify-center w-full min-w-0">
        <t.Scene reduce={reduce} />
      </div>
    </div>
  );

  return (
    <section id="features" className="border-b border-border bg-background">
      {/* heading — centered, tight */}
      <div className="max-w-[1080px] mx-auto px-8 pt-28 pb-8 text-center">
        <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.2rem]">Features</div>
        <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] text-text-primary">
          Everything Luna does,<br />in one place.
        </h2>
      </div>

      {/* pinned tile row — icon-above-label; active tile is a CIRCLE with ring */}
      <div className="sticky top-[76px] z-30 bg-background/85 backdrop-blur-md">
        <div
          role="tablist"
          aria-label="Luna features"
          className="features-tilerow max-w-[1100px] mx-auto px-6 flex items-start gap-1 sm:gap-2 overflow-x-auto py-4"
        >
          {TABS.map((t, i) => {
            const isActive = i === active;
            return (
              <button
                key={t.id}
                ref={(el) => { tabRefs.current[i] = el; }}
                role="tab"
                id={`feature-tab-${t.id}`}
                aria-selected={isActive}
                aria-controls={`feature-panel-${t.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => jumpTo(i)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className="group shrink-0 flex flex-col items-center gap-[8px] w-[98px] sm:w-[108px] px-1 pt-1 pb-[6px] rounded-[14px] focus:outline-none snap-start"
              >
                {/* icon container — CIRCLE when active, rounded-square when not */}
                <span
                  className={`relative w-[46px] h-[46px] flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'rounded-full bg-btn-bg text-btn-text shadow-[0_6px_16px_rgba(0,0,0,0.14)]'
                      : 'rounded-[14px] bg-background3 text-text-tertiary group-hover:text-text-secondary group-hover:bg-background4'
                  }`}
                >
                  {t.icon}
                  {/* progress ring — SVG circle, sweeps 0→360° around the circle */}
                  {isActive && (
                    <svg
                      className="absolute inset-[-4px] w-[54px] h-[54px] -rotate-90 pointer-events-none text-text-primary"
                      viewBox="0 0 54 54"
                    >
                      <motion.circle
                        cx="27"
                        cy="27"
                        r="25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ pathLength: progress }}
                      />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-[0.68rem] text-center leading-tight tracking-[-0.01em] transition-colors duration-200 ${
                    isActive ? 'text-text-primary font-medium' : 'text-text-tertiary group-hover:text-text-secondary'
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-[1px] bg-border" />
      </div>

      {/* bounded canvas — base surface so nodes read as elevated; fixed min-h */}
      <div className="max-w-[1060px] mx-auto px-6 sm:px-8 py-12">
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative rounded-[20px] border border-border-md bg-background px-6 sm:px-12 py-12 min-h-[460px] sm:min-h-[520px] flex items-center overflow-hidden"
        >
          {reduce ? (
            <div role="tabpanel" id={`feature-panel-${current.id}`} aria-labelledby={`feature-tab-${current.id}`} className="w-full">
              <SceneInner t={current} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                role="tabpanel"
                id={`feature-panel-${current.id}`}
                aria-labelledby={`feature-tab-${current.id}`}
                className="w-full"
                variants={sceneVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <SceneInner t={current} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <style jsx>{`
        /* copy LEFT ~38%, mock fills ~62% */
        .features-panel-grid {
          grid-template-columns: minmax(0, 0.62fr) minmax(0, 1fr);
        }
        @media (max-width: 860px) {
          .features-panel-grid {
            grid-template-columns: 1fr;
          }
        }
        /* centered tile row on desktop; horizontal-scroll + snap on phones */
        .features-tilerow {
          justify-content: center;
          scrollbar-width: none;
          scroll-snap-type: x proximity;
        }
        .features-tilerow::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 720px) {
          .features-tilerow {
            justify-content: flex-start;
          }
        }
      `}</style>
    </section>
  );
}
