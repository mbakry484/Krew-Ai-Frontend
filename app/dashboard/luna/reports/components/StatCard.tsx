'use client';

import { ReactNode } from 'react';
import { Delta } from './_shared';

/**
 * Clickable hero stat card. Big number + delta + optional breakdown row.
 * Acts as a "doorway" — onClick opens the drill-down panel.
 */
export default function StatCard({
  label,
  value,
  sublabel,
  deltaPct,
  lowerIsBetter = false,
  icon,
  emphasis = false,
  breakdown,
  onClick,
}: {
  label: string;
  value: string;
  sublabel?: string;
  deltaPct: number;
  lowerIsBetter?: boolean;
  icon: ReactNode;
  emphasis?: boolean;
  breakdown?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left w-full bg-background border rounded-[12px] p-[1.2rem] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background2 hover:-translate-y-[1px] ${
        emphasis
          ? 'border-border-md hover:border-border-hover bg-gradient-to-b from-background to-background2'
          : 'border-border hover:border-border-md'
      }`}
    >
      <div className="flex items-start justify-between mb-[0.9rem]">
        <div className="text-text-tertiary group-hover:text-text-secondary transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{icon}</svg>
        </div>
        <Delta pct={deltaPct} lowerIsBetter={lowerIsBetter} />
      </div>
      <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary mb-[0.3rem] flex items-center gap-[6px]">
        {label}
        {emphasis && (
          <span className="text-[0.5rem] tracking-[0.06em] text-[#6bcf8f] border border-[#6bcf8f]/30 rounded-full px-[5px] py-[1px] leading-none">
            revenue saved
          </span>
        )}
      </div>
      <div className="text-[1.9rem] font-light tracking-[-0.04em] text-text-primary leading-[1.1]">{value}</div>
      {sublabel && <div className="text-[0.64rem] text-text-secondary mt-[0.3rem]">{sublabel}</div>}
      {breakdown && <div className="mt-[0.7rem] pt-[0.7rem] border-t border-border">{breakdown}</div>}
      <div className="mt-[0.7rem] flex items-center gap-1 text-[0.6rem] text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-[9px] h-[9px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
        view conversations
      </div>
    </button>
  );
}
