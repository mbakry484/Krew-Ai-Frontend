'use client';

import IvyShell from '../components/IvyShell';
import { IvyStatCard } from '../components/_ivyShared';
import { SectionCard, formatEGP, timeAgo } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';

/** Small "Shopify" source pill — inventory is synced, not hand-edited. */
function ShopifyBadge() {
  return (
    <span className="flex items-center gap-[5px] text-[0.55rem] uppercase tracking-[0.06em] text-text-tertiary border border-border rounded-full px-[7px] py-[2px] leading-none">
      <svg className="w-[9px] h-[9px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      Shopify
    </span>
  );
}

export default function IvyInventory() {
  const state = useIvy();

  const { inventory_value: value, units, updated_at } = state.inventory;
  const avgUnitPrice = units > 0 ? Math.round(value / units) : 0;

  return (
    <IvyShell title="inventory" subtitle="what you're holding, valued live from Shopify">
      {/* Main bullets — read-only, synced from Shopify */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IvyStatCard
          label="Inventory Value"
          value={formatEGP(value)}
          sublabel={`last synced ${timeAgo(updated_at)}`}
          icon={<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11m-8-4v10l8 4"/>}
          topRight={<ShopifyBadge />}
        />
        <IvyStatCard
          label="Units in Stock"
          value={units.toLocaleString('en-US')}
          sublabel={`${units.toLocaleString('en-US')} units · ${formatEGP(avgUnitPrice)} avg price`}
          icon={<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12"/>}
          topRight={<ShopifyBadge />}
        />
      </div>

      <SectionCard title="How this is calculated" subtitle="automatic — no manual entry">
        <div className="flex flex-col gap-4">
          {/* value = units × avg price, shown as a formula */}
          <div className="flex flex-wrap items-center gap-3 bg-background2 border border-border rounded-[10px] px-4 py-4">
            <div className="text-center">
              <div className="text-[1.1rem] font-light tracking-[-0.03em] text-text-primary tabular-nums">{units.toLocaleString('en-US')}</div>
              <div className="text-[0.58rem] uppercase tracking-[0.08em] text-text-tertiary mt-[2px]">units</div>
            </div>
            <span className="text-text-tertiary text-[1rem]">×</span>
            <div className="text-center">
              <div className="text-[1.1rem] font-light tracking-[-0.03em] text-text-primary tabular-nums">{formatEGP(avgUnitPrice)}</div>
              <div className="text-[0.58rem] uppercase tracking-[0.08em] text-text-tertiary mt-[2px]">avg unit price</div>
            </div>
            <span className="text-text-tertiary text-[1rem]">=</span>
            <div className="text-center">
              <div className="text-[1.1rem] font-light tracking-[-0.03em] text-ivy-accent tabular-nums">{formatEGP(value)}</div>
              <div className="text-[0.58rem] uppercase tracking-[0.08em] text-text-tertiary mt-[2px]">inventory value</div>
            </div>
          </div>

          <p className="text-[0.7rem] text-text-secondary leading-[1.7]">
            Ivy reads your live Shopify catalog — total units in stock multiplied by
            their prices — so this number stays honest without any manual entry. It
            refreshes whenever your Shopify inventory changes. Sales targets and
            forecasting live in analytics, not here.
          </p>
        </div>
      </SectionCard>
    </IvyShell>
  );
}
