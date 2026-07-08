'use client';

import { ReactNode } from 'react';
import { ExpenseSource } from '@/lib/ivy/types';

// Ivy-specific building blocks. Anything generic (formatEGP, Delta, SectionCard,
// EmptyState, SkeletonRows) lives in components/DashboardPrimitives.tsx and is
// shared with the Luna dashboard — do not duplicate it here.

/** Stat card in the exact style of Luna's Overview stat cards. */
export function IvyStatCard({
  label,
  value,
  sublabel,
  icon,
  topRight,
  onClick,
  children,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: ReactNode;
  /** Slot opposite the icon (e.g. a Delta pill). */
  topRight?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`bg-background3 border border-border rounded-2xl p-[1.2rem] transition-colors duration-200 hover:border-border-md text-left w-full ${
        onClick ? 'cursor-pointer hover:bg-background4' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-[0.9rem]">
        <div className="text-text-tertiary">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{icon}</svg>
        </div>
        {topRight}
      </div>
      <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary mb-[0.3rem]">{label}</div>
      <div className="text-[1.9rem] font-light tracking-[-0.04em] text-text-primary leading-[1.1]">{value}</div>
      {sublabel && <div className="text-[0.64rem] text-text-secondary mt-[0.35rem]">{sublabel}</div>}
      {children}
    </Tag>
  );
}

/** Small icon per expense source (text / voice / receipt). */
export function SourceIcon({ source, className = 'w-[12px] h-[12px]' }: { source: ExpenseSource; className?: string }) {
  if (source === 'voice') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
      </svg>
    );
  }
  if (source === 'receipt') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5 4 2z" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="13" y2="16" />
      </svg>
    );
  }
  // text
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="13" y2="13" />
    </svg>
  );
}

/** Thin progress/spend bar. `tone` picks fill color from existing values. */
export function ProgressBar({
  pct,
  tone = 'accent',
  className = '',
}: {
  pct: number; // 0–100
  tone?: 'accent' | 'warning';
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={`h-[6px] rounded-full bg-background4 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${clamped}%`,
          // warning pulls from the existing negative-state value (#e07070, same
          // red the shared Delta pill uses) — no new ambers/oranges invented.
          background: tone === 'warning' ? '#e07070' : 'var(--ivy-accent)',
        }}
      />
    </div>
  );
}

/** Tiny inline sparkline (teal) for trend context inside a stat card.
    `draw` animates the stroke drawing in from the left (see .krew-draw). */
export function Sparkline({ points, width = 96, height = 28, draw = false }: { points: number[]; width?: number; height?: number; draw?: boolean }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - 3 - ((p - min) / span) * (height - 6)).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      <path d={d} pathLength={1} className={draw ? 'krew-draw' : undefined} fill="none" stroke="var(--ivy-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={width}
        cy={height - 3 - ((points[points.length - 1] - min) / span) * (height - 6)}
        r="2"
        fill="var(--ivy-accent)"
      />
    </svg>
  );
}
