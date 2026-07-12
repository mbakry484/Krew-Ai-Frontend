'use client';

import { IvyStatCard } from '../_ivyShared';
import { ArcGauge } from '@/components/AuraSystem';
import { formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { selectInventoryStats } from '@/lib/ivy/ivyClient';

// Zone A — three header stats. Inventory value is now COST-based (money locked
// in stock); the third card is the cost-coverage nudge that powers the whole
// COGS model, so it gets a ring + a CTA into the missing-cost filter.

export default function InventoryHeaderStats({
  onAddMissingCosts,
}: {
  onAddMissingCosts: () => void;
}) {
  const state = useIvy();
  const { costValue, retailValue, units, withCost, total, coveragePct } = selectInventoryStats(state);
  const fullyCovered = total > 0 && withCost === total;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <IvyStatCard
        label="money locked in stock"
        value={formatEGP(costValue)}
        sublabel={`retail value ${formatEGP(retailValue)}`}
        icon={<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11m-8-4v10l8 4" />}
      />

      <IvyStatCard
        label="Units in stock"
        value={units.toLocaleString('en-US')}
        sublabel={`${total} product${total !== 1 ? 's' : ''} in catalog`}
        icon={<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12" />}
      />

      {/* Cost coverage — the nudge engine */}
      <div className="bg-background3 border border-border rounded-2xl p-[1.2rem] flex flex-col">
        <div className="flex items-start justify-between mb-[0.9rem]">
          <div className="text-text-tertiary">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <circle cx="12" cy="12" r="6" />
            </svg>
          </div>
        </div>
        <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary mb-[0.6rem]">Cost coverage</div>
        <div className="flex items-center gap-4">
          <ArcGauge pct={coveragePct} size={70} stroke={6}>
            <span className="text-[0.9rem] font-light tracking-[-0.02em] text-text-primary tabular-nums">
              {withCost}/{total}
            </span>
          </ArcGauge>
          <div className="flex-1 min-w-0">
            <div className="text-[0.72rem] text-text-secondary leading-[1.4]">
              {withCost} of {total} products have costs
            </div>
            <div className="text-[0.64rem] text-text-tertiary mt-1">profit accuracy depends on this.</div>
            {!fullyCovered && (
              <button
                onClick={onAddMissingCosts}
                className="mt-2 text-[0.7rem] text-ivy-accent hover:brightness-110 transition-[filter] duration-150"
              >
                add missing costs →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
