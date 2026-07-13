'use client';

import { useEffect, useState } from 'react';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';
import { AlertPreferences } from '@/lib/ivy/types';

// TASK 3 — alert preferences. Calm, direct rows; each alert is delivered over
// Telegram. Thresholds are editable numbers, persisted via PATCH
// /api/ivy/alert-preferences (stubbed). All state flows through ivyClient.

function TelegramChannel() {
  return (
    <span className="inline-flex items-center gap-[5px] text-[0.56rem] uppercase tracking-[0.06em] text-text-tertiary">
      <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
      Telegram
    </span>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`relative w-[38px] h-[21px] rounded-full transition-colors duration-200 shrink-0 ${
        on ? 'bg-ivy-accent' : 'bg-border-md'
      }`}
    >
      <span
        className={`absolute top-[3px] w-[15px] h-[15px] rounded-full bg-background transition-all duration-200 ${
          on ? 'left-[20px]' : 'left-[3px]'
        }`}
      />
    </button>
  );
}

/** One alert row — threshold committed on blur/Enter so partial edits don't fight. */
function AlertRow({
  name,
  desc,
  enabled,
  value,
  unit,
  prefix,
  onToggle,
  onValue,
}: {
  name: string;
  desc: string;
  enabled: boolean;
  value: number;
  unit: string;
  prefix?: string;
  onToggle: (v: boolean) => void;
  onValue: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n) && n > 0) onValue(Math.round(n));
    else setDraft(String(value));
  };

  return (
    <div className="flex items-center justify-between gap-4 bg-background2 border border-border rounded-[10px] px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[0.75rem] text-text-primary">{name}</span>
          <TelegramChannel />
        </div>
        <div className="text-[0.66rem] text-text-tertiary mt-[2px]">{desc}</div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className={`flex items-center gap-1 transition-opacity duration-150 ${enabled ? '' : 'opacity-40'}`}>
          {prefix && <span className="text-[0.66rem] text-text-tertiary">{prefix}</span>}
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={draft}
            disabled={!enabled}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
            className="w-[56px] bg-input-bg border border-border rounded-[6px] px-2 py-[4px] text-[0.72rem] text-text-primary tabular-nums text-right focus:outline-none focus:border-border-hover transition-colors duration-150 disabled:cursor-not-allowed"
          />
          <span className="text-[0.62rem] text-text-tertiary w-[26px]">{unit}</span>
        </div>
        <Toggle on={enabled} onChange={onToggle} label={name} />
      </div>
    </div>
  );
}

export default function AlertPreferencesSection() {
  const { alertPreferences: p } = useIvy();
  const save = (next: AlertPreferences) => ivyClient.updateAlertPreferences(next);

  return (
    <div className="flex flex-col gap-2">
      <AlertRow
        name="Best seller running low"
        desc="When a top product drops below this many days of stock."
        enabled={p.bestSellerLowStock.enabled}
        value={p.bestSellerLowStock.thresholdDays}
        unit="days"
        onToggle={(enabled) => save({ ...p, bestSellerLowStock: { ...p.bestSellerLowStock, enabled } })}
        onValue={(thresholdDays) => save({ ...p, bestSellerLowStock: { ...p.bestSellerLowStock, thresholdDays } })}
      />
      <AlertRow
        name="Any product selling out"
        desc="For every product, not just best sellers, below this cover."
        enabled={p.anyLowStock.enabled}
        value={p.anyLowStock.thresholdDays}
        unit="days"
        onToggle={(enabled) => save({ ...p, anyLowStock: { ...p.anyLowStock, enabled } })}
        onValue={(thresholdDays) => save({ ...p, anyLowStock: { ...p.anyLowStock, thresholdDays } })}
      />
      <AlertRow
        name="Dead stock"
        desc="Products with no sales for this many days — cash sitting still."
        enabled={p.deadStock.enabled}
        value={p.deadStock.thresholdDays}
        unit="days"
        onToggle={(enabled) => save({ ...p, deadStock: { ...p.deadStock, enabled } })}
        onValue={(thresholdDays) => save({ ...p, deadStock: { ...p.deadStock, thresholdDays } })}
      />
      <AlertRow
        name="Return rate spike"
        desc="When returns climb this many points versus last month."
        enabled={p.returnRateSpike.enabled}
        value={p.returnRateSpike.thresholdPts}
        unit="pts"
        prefix="+"
        onToggle={(enabled) => save({ ...p, returnRateSpike: { ...p.returnRateSpike, enabled } })}
        onValue={(thresholdPts) => save({ ...p, returnRateSpike: { ...p.returnRateSpike, thresholdPts } })}
      />
      <AlertRow
        name="Capital pool running low"
        desc="When any capital pool's balance falls under this amount."
        enabled={p.poolLow.enabled}
        value={p.poolLow.thresholdEgp}
        unit=""
        prefix="EGP"
        onToggle={(enabled) => save({ ...p, poolLow: { ...p.poolLow, enabled } })}
        onValue={(thresholdEgp) => save({ ...p, poolLow: { ...p.poolLow, thresholdEgp } })}
      />
    </div>
  );
}
