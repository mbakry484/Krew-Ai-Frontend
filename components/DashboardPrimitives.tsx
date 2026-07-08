'use client';

import { ReactNode } from 'react';

// Shared dashboard primitives used by both agent dashboards (Luna + Ivy).
// Promoted from app/dashboard/luna/reports/components/_shared.tsx — that file
// re-exports these, so existing Luna imports keep working unchanged.

// ─── Formatters ───────────────────────────────────────────────────────────────
export function formatEGP(n: number): string {
  return `EGP ${n.toLocaleString('en-US')}`;
}

export function formatDuration(sec: number): string {
  if (sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function formatRelative(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Coarse relative timestamp ("2h ago") — coarse on purpose so SSR/client match. */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ─── Delta pill (green up / red down, respects lowerIsBetter) ──────────────────
export function Delta({
  pct,
  lowerIsBetter = false,
  suffix = '%',
}: {
  pct: number;
  lowerIsBetter?: boolean;
  suffix?: string;
}) {
  if (pct === 0) {
    return <span className="text-[0.68rem] text-text-tertiary flex items-center gap-[3px]">±0{suffix}</span>;
  }
  const rising = pct > 0;
  const good = lowerIsBetter ? !rising : rising;
  return (
    <span className={`text-[0.68rem] flex items-center gap-[3px] ${good ? 'text-[#6bcf8f]' : 'text-[#e07070]'}`}>
      {rising ? (
        <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
      ) : (
        <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7l10 10M17 7v10H7" /></svg>
      )}
      {rising ? '+' : ''}{pct}{suffix}
    </span>
  );
}

// ─── Section card shell ───────────────────────────────────────────────────────
export function SectionCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-background border border-border rounded-[12px] p-[1.4rem] ${className}`}>
      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">{title}</div>
      {subtitle && <p className="text-[0.68rem] text-text-secondary mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

// ─── Skeleton + empty primitives ──────────────────────────────────────────────
export function SkeletonRows({ count = 3, height = 58 }: { count?: number; height?: number }) {
  return (
    <div className="flex flex-col gap-[0.6rem]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-background2 border border-border rounded-[8px] motion-safe:animate-pulse" style={{ height }} />
      ))}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-[0.72rem] text-text-tertiary py-6 text-center flex flex-col items-center gap-2">
      <svg className="w-5 h-5 text-text-tertiary opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 4-5" />
      </svg>
      {text}
    </div>
  );
}
