'use client';

import DashboardModal from '@/components/DashboardModal';
import { EmptyState, formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { selectBostaUnmatched } from '@/lib/ivy/ivyClient';
import { IvyPeriod } from '@/lib/ivy/types';

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

/** Deliveries Bosta reported but couldn't tie to a Shopify order — counted in
    revenue, no product breakdown. Read-only in v1: no attach-order action yet. */
export default function BostaUnmatchedModal({
  period,
  onClose,
}: {
  period: IvyPeriod;
  onClose: () => void;
}) {
  const state = useIvy();
  const rows = selectBostaUnmatched(state, period);

  return (
    <DashboardModal onClose={onClose} labelledBy="bosta-unmatched-title">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
        <div>
          <div id="bosta-unmatched-title" className="text-[0.82rem] font-medium text-text-primary">
            Deliveries not linked to an order
          </div>
          <div className="text-[0.64rem] text-text-tertiary mt-[2px]">
            counted in revenue, but with no product breakdown
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-4">
        {rows.length === 0 ? (
          <EmptyState text="nothing unmatched in this period" />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-normal text-[0.58rem] uppercase tracking-[0.08em] text-text-tertiary px-2 py-2">Date</th>
                <th className="text-left font-normal text-[0.58rem] uppercase tracking-[0.08em] text-text-tertiary px-2 py-2">Tracking</th>
                <th className="text-right font-normal text-[0.58rem] uppercase tracking-[0.08em] text-text-tertiary px-2 py-2">Value</th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.trackingNumber} className="border-b border-border last:border-b-0">
                  <td className="px-2 py-[9px] text-[0.72rem] text-text-secondary whitespace-nowrap">{formatDay(d.deliveredAt)}</td>
                  <td className="px-2 py-[9px] text-[0.72rem] text-text-primary truncate">{d.trackingNumber}</td>
                  <td className="px-2 py-[9px] text-[0.75rem] text-text-primary tabular-nums text-right whitespace-nowrap">
                    {formatEGP(d.deliveredValue)}
                  </td>
                  <td className="px-2 py-[9px]">
                    <span
                      className="group relative inline-flex text-text-tertiary hover:text-text-secondary transition-colors duration-150 cursor-default"
                      title="why?"
                    >
                      <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                      <span className="pointer-events-none absolute right-0 top-[calc(100%+8px)] z-10 w-[240px] rounded-[10px] border border-border-md bg-background px-3 py-2 text-[0.64rem] text-text-secondary leading-[1.5] opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                        we couldn&apos;t find a Shopify order matching Bosta&apos;s businessReference for
                        this delivery — probably a manual entry or a custom reference. Revenue is
                        counted, but there&apos;s no product breakdown.
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="px-5 py-4 border-t border-border shrink-0 flex items-center justify-end">
        <button
          onClick={onClose}
          className="rounded-[9px] border border-border px-4 py-[7px] text-[0.72rem] text-text-secondary hover:border-border-md hover:text-text-primary transition-all duration-150"
        >
          Close
        </button>
      </div>
    </DashboardModal>
  );
}
