'use client';

import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';

// =============================================================================
// KREW AURA SYSTEM — shared presentation primitives for every agent dashboard.
// =============================================================================
// The system's rules, in code form:
//   - color = state, delivered as blurred light (AuraField), never flat fills
//   - one hero number per page, animated (CountUp)
//   - progress reads as glowing shapes (ArcGauge), not gray widget bars
//   - agents speak in chips (AgentSays), not alert banners
//   - enter choreography and draw-on effects live in globals.css
//     (`.krew-stagger`, `.krew-draw`)
// All presentation-only: nothing here touches a data seam. Agent accents stay
// the fixed identity hues (Luna 330, Ivy 152).

// ─── AuraField — soft light field behind a hero surface ──────────────────────
/**
 * Generalized from the My Krew card aura: a color wash across the whole
 * surface plus an optional slowly-rotating glow blob anchored toward `anchor`
 * (degrees). `alert` bleeds a warm second bloom into the field — pulled from
 * the shared negative-state red, not a new color. Render behind a
 * `relative z-[1]` content layer inside an `overflow-hidden` parent.
 */
export function AuraField({
  hue,
  sat = 55,
  anchor = 215,
  intensity = 1,
  orb = true,
  lens = false,
  alert = false,
}: {
  hue: number;
  sat?: number;
  anchor?: number;
  /** 0–1: overall strength of the field. */
  intensity?: number;
  orb?: boolean;
  /** Floating glass lens over the glow — for hero surfaces. */
  lens?: boolean;
  alert?: boolean;
}) {
  const rad = (anchor * Math.PI) / 180;
  const x = 50 + Math.cos(rad) * 38;
  const y = 50 + Math.sin(rad) * 38;

  const style = {
    '--aura-hue': `${hue}`,
    '--aura-sat': `${sat}%`,
    '--aura-x': `${x.toFixed(1)}%`,
    '--aura-y': `${y.toFixed(1)}%`,
    '--aura-delay': `${(-((hue % 97) / 10)).toFixed(1)}s`,
    '--field-intensity': `${intensity}`,
  } as CSSProperties;

  return (
    <div className="aura-field" aria-hidden="true" style={style}>
      <div className="aura-field-wash" />
      {orb && (
        <div className="aura-field-orb">
          <div className="aura-field-blob" />
          {lens && <div className="aura-field-lens" />}
        </div>
      )}
      {alert && <div className="aura-field-alert" />}
    </div>
  );
}

// ─── CountUp — hero numerals that spring to their value ──────────────────────
/**
 * Animates from the previously shown value (0 on first mount, so numbers
 * count up on page load) whenever `value` changes — e.g. on period switch.
 * Static under prefers-reduced-motion. Always tabular so digits don't jitter.
 */
export function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString('en-US'),
  duration = 900,
  className = '',
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = value;
    if (from === value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`} aria-label={format(value)}>
      {format(display)}
    </span>
  );
}

// ─── ArcGauge — glowing 270° arc, draws on and eases between values ──────────
export function ArcGauge({
  pct,
  size = 104,
  stroke = 7,
  color = 'var(--ivy-accent)',
  children,
}: {
  pct: number; // 0–100
  size?: number;
  stroke?: number;
  /** Any CSS color — also drives the glow. */
  color?: string;
  /** Centered content (the numeral). */
  children?: ReactNode;
}) {
  // Start fully undrawn, then transition to the real value → draw-on effect.
  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(Math.max(0, Math.min(100, pct))));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75; // 270° open at the bottom

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[135deg]" aria-hidden="true">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--bg4)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
          strokeDashoffset={arc * (1 - drawn / 100)}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1), stroke 300ms ease',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
          className="motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

// ─── AgentSays — the agent speaks; replaces ERP alert banners ────────────────
export function AgentSays({
  agent,
  hue,
  message,
  severity = 'info',
  actionLabel = 'View',
  onAction,
  onDismiss,
}: {
  agent: string;
  hue: number;
  message: string;
  severity?: 'warning' | 'info';
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}) {
  // Warning pulls the shared negative-state red — never a new amber/orange.
  const dot = severity === 'warning' ? '#e07070' : `hsl(${hue} 65% 62%)`;
  return (
    <div
      className="relative overflow-hidden flex items-center gap-3 rounded-[16px] border border-border px-4 py-3"
      style={{
        background: `linear-gradient(95deg, hsl(${hue} 55% 55% / 0.09) 0%, hsl(${hue} 55% 55% / 0.02) 45%, transparent 100%)`,
      }}
    >
      <span
        className="w-[7px] h-[7px] rounded-full shrink-0 animate-pulse"
        style={{ background: dot, boxShadow: `0 0 8px ${dot}` }}
      />
      <span className="flex-1 min-w-0 text-[0.74rem] text-text-secondary leading-[1.55]">
        <span className="text-[0.6rem] uppercase tracking-[0.1em] text-text-tertiary mr-2 align-middle">{agent} says</span>
        {message}
      </span>
      {onAction && (
        <button
          onClick={onAction}
          className="text-[0.66rem] text-text-tertiary hover:text-text-primary transition-colors duration-150 shrink-0"
        >
          {actionLabel}
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-text-tertiary hover:text-text-primary transition-colors duration-150 shrink-0 p-[2px]"
        >
          <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
