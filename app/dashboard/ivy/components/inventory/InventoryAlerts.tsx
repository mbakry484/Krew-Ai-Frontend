'use client';

import { useMemo } from 'react';
import ProductThumb from './ProductThumb';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient, selectInventoryAlerts } from '@/lib/ivy/ivyClient';
import { AlertSeverity } from '@/lib/ivy/types';

// Zone B — alerts strip. Severity maps to the dashboard's existing palette
// (no invented amber): critical = the negative red, warning = teal accent,
// neutral = tertiary gray. Only rendered when there are active alerts.

const EDGE_COLOR: Record<AlertSeverity, string> = {
  critical: '#e07070',
  warning: 'var(--ivy-accent)',
  neutral: 'var(--text-tertiary)',
};

export default function InventoryAlerts() {
  const state = useIvy();
  const alerts = selectInventoryAlerts(state, 'inventory');
  const productById = useMemo(
    () => new Map(state.products.map((p) => [p.variantId, p])),
    [state.products],
  );

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[0.6rem] uppercase tracking-[0.09em] text-text-tertiary">Needs attention</span>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {alerts.map((a) => {
          const product = a.variantId ? productById.get(a.variantId) : undefined;
          return (
            <div
              key={a.id}
              className="relative flex overflow-hidden rounded-[14px] border border-border bg-background min-w-[300px] max-w-[360px] shrink-0"
            >
              <span className="w-[3px] shrink-0" style={{ background: EDGE_COLOR[a.severity] }} aria-hidden="true" />
              <div className="flex-1 min-w-0 p-3.5 flex items-start gap-3">
                <ProductThumb
                  title={product?.productTitle ?? a.title}
                  imageUrl={product?.imageUrl ?? null}
                  size={36}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[0.72rem] font-medium text-text-primary truncate">{a.title}</div>
                  <div className="text-[0.68rem] text-text-secondary leading-[1.5] mt-1">{a.body}</div>
                </div>
                <button
                  onClick={() => ivyClient.dismissAlert(a.id)}
                  aria-label="Dismiss alert"
                  className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors duration-150 p-[2px]"
                >
                  <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
