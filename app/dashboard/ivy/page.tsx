'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import IvyShell from './components/IvyShell';
import CapitalCard, { cardDigits } from './components/CapitalCard';
import TelegramLinkBanner from './components/onboarding/TelegramLinkBanner';
import { Sparkline, SourceIcon } from './components/_ivyShared';
import { AgentSays, ArcGauge, AuraField, CountUp } from '@/components/AuraSystem';
import { Delta, EmptyState, formatEGP, timeAgo } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import {
  ivyClient,
  selectActiveNudges,
  selectActivityFeed,
  selectCashRemaining,
  selectCategoryBreakdown,
  selectCogsAndCash,
  selectPeriodMetrics,
  selectPreviousMetrics,
} from '@/lib/ivy/ivyClient';
import { EXPENSE_CATEGORY_LABEL, IVY_PERIOD_LABEL, IvyPeriod } from '@/lib/ivy/types';

const PERIODS: IvyPeriod[] = ['this_month', 'last_month', 'last_90'];

// Ivy's identity hue — same colorway seed as her My Krew card (teal, 152).
const IVY_HUE = 152;

/** Soft tile — the aura-system surface; hierarchy comes from type + light, not chrome. */
const tileCls = 'relative overflow-hidden rounded-[20px] border border-border bg-background p-6';
const tileLabelCls = 'text-[0.6rem] uppercase tracking-[0.09em] text-text-tertiary';

/** % change vs previous period; null when there is no baseline to compare. */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export default function IvyOverview() {
  const router = useRouter();
  const state = useIvy();
  const [period, setPeriod] = useState<IvyPeriod>('this_month');

  const metrics = useMemo(() => selectPeriodMetrics(state, period), [state, period]);
  const prev = useMemo(() => selectPreviousMetrics(state, period), [state, period]);
  const cash = useMemo(() => selectCashRemaining(state), [state]);
  const cogsAndCash = useMemo(() => selectCogsAndCash(state, period), [state, period]);
  const nudges = selectActiveNudges(state);
  const breakdown = useMemo(() => selectCategoryBreakdown(state, { period }), [state, period]);
  const recentActivity = useMemo(() => selectActivityFeed(state).slice(0, 5), [state]);

  const inventoryPct = state.target.sales_target > 0
    ? (state.inventory.inventory_value / state.target.sales_target) * 100
    : 0;
  const inventoryGap = state.target.sales_target - state.inventory.inventory_value;

  // Two-layer profit: the hero shows REAL net profit (net revenue − COGS −
  // expenses). COGS scales with delivered revenue, so the trend delta compares
  // against the previous period at the same blended cost ratio.
  const { cogs, cashDelta, costCoveragePct, realNetProfit } = cogsAndCash;
  const hasCogs = costCoveragePct > 0;
  const cogsRatio = metrics.grossDelivered > 0 ? cogs / metrics.grossDelivered : 0;
  const prevRealNetProfit =
    prev.netRevenue - Math.round(cogsRatio * prev.grossDelivered) - prev.expensesTotal;
  const profitDelta = pctChange(realNetProfit, prevRealNetProfit);
  const returnRateDelta =
    metrics.returnRatePct !== null && prev.returnRatePct !== null
      ? Math.round((metrics.returnRatePct - prev.returnRatePct) * 10) / 10
      : null;

  const returnRate = metrics.returnRatePct;
  // Warning threshold mirrors the nudge logic — a quarter of gross coming back.
  const returnsHot = returnRate !== null && returnRate >= 25;
  const hasWarnings = nudges.some((n) => n.severity === 'warning');

  const breakdownTotal = breakdown.reduce((s, b) => s + b.total, 0);
  const primaryPool = state.capitals[0];

  const periodTabs = (
    <div className="inline-flex rounded-[9px] border border-border p-[3px] bg-background" role="tablist" aria-label="Period">
      {PERIODS.map((p) => {
        const active = period === p;
        return (
          <button
            key={p}
            role="tab"
            aria-selected={active}
            onClick={() => setPeriod(p)}
            className={`px-3 py-[5px] rounded-[6px] text-[0.7rem] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 ${
              active ? 'bg-background2 text-text-primary border border-border-md' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {IVY_PERIOD_LABEL[p]}
          </button>
        );
      })}
    </div>
  );

  return (
    <IvyShell
      title="financial overview"
      subtitle="real profit, cash, and return visibility"
      actions={periodTabs}
    >
      <div className="krew-stagger flex flex-col gap-5">

        {/* Persistent Telegram-linking nudge — until the account is linked */}
        <TelegramLinkBanner />

        {/* Ivy speaks — replaces the old alert banners */}
        {nudges.map((n) => (
          <AgentSays
            key={n.id}
            agent="Ivy"
            hue={IVY_HUE}
            message={n.message}
            severity={n.severity}
            onAction={n.href ? () => router.push(n.href!) : undefined}
            onDismiss={() => ivyClient.dismissNudge(n.id)}
          />
        ))}

        {/* Hero — the one number Ivy exists for, plus the capital card echo */}
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-background">
          <AuraField hue={IVY_HUE} sat={55} anchor={210} lens alert={hasWarnings} />
          <div className="relative z-[1] p-8 max-md:p-6 grid lg:grid-cols-[1fr_300px] gap-x-12 gap-y-8 items-center">
            <div>
              <div className={tileLabelCls}>Real net profit — {IVY_PERIOD_LABEL[period]}</div>
              <div className="text-[3rem] max-md:text-[2.1rem] font-light tracking-[-0.045em] leading-[1.08] text-text-primary mt-2">
                <CountUp value={realNetProfit} format={formatEGP} duration={1100} />
              </div>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {profitDelta !== null && <Delta pct={profitDelta} />}
                <span className="text-[0.7rem] text-text-secondary">
                  net revenue {formatEGP(metrics.netRevenue)}
                  {hasCogs && <> − COGS {formatEGP(cogs)}</>} − expenses {formatEGP(metrics.expensesTotal)}
                </span>
              </div>

              {/* Second layer — profit vs cash */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {hasCogs ? (
                  <span
                    className="group relative inline-flex items-center gap-[6px] rounded-full border border-border bg-background2 px-[11px] py-[4px] text-[0.68rem] cursor-default"
                    title="profit ≠ cash. you restocked — that money became inventory, not loss."
                  >
                    <span className={cashDelta < 0 ? 'text-[#e07070]' : 'text-[#6bcf8f]'}>
                      cash {cashDelta < 0 ? '−' : '+'}{formatEGP(Math.abs(cashDelta))}
                    </span>
                    <span className="text-text-tertiary">{IVY_PERIOD_LABEL[period].toLowerCase()}</span>
                    <svg className="w-[11px] h-[11px] text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                    <span className="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-10 w-[248px] rounded-[10px] border border-border-md bg-background px-3 py-2 text-[0.66rem] text-text-secondary leading-[1.5] opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                      profit ≠ cash. you restocked — that money became inventory, not loss.
                    </span>
                  </span>
                ) : (
                  <button
                    onClick={() => router.push('/dashboard/ivy/inventory')}
                    className="text-[0.7rem] text-ivy-accent hover:brightness-110 transition-[filter] duration-150"
                  >
                    add product costs to see true profit →
                  </button>
                )}
              </div>
            </div>

            {/* What you minted in Capital lives here too */}
            {primaryPool && (
              <div className="max-lg:max-w-[340px]">
                <div className={`${tileLabelCls} mb-2 flex items-center justify-between`}>
                  <span>Cash · {state.capitals.length} pool{state.capitals.length !== 1 ? 's' : ''}</span>
                  <span className="normal-case tracking-normal text-[0.62rem]">{formatEGP(cash.remaining)} total</span>
                </div>
                <CapitalCard
                  size="sm"
                  name={primaryPool.name}
                  injected={primaryPool.initial_amount}
                  balance={primaryPool.current_balance}
                  color={primaryPool.color}
                  digits={cardDigits(primaryPool.id)}
                  onClick={() => router.push('/dashboard/ivy/capital')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pulse row — glowing shapes, not widget bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Return rate */}
          <div className={tileCls}>
            <div className="flex items-center justify-between mb-4">
              <span className={tileLabelCls}>Return rate</span>
              {returnRateDelta !== null && <Delta pct={returnRateDelta} lowerIsBetter suffix=" pts" />}
            </div>
            <div className="flex items-center gap-5">
              <ArcGauge pct={returnRate ?? 0} color={returnsHot ? '#e07070' : 'var(--ivy-accent)'}>
                <CountUp
                  value={returnRate ?? 0}
                  format={(n) => `${n.toFixed(1)}%`}
                  className="text-[1.05rem] font-light tracking-[-0.03em] text-text-primary"
                />
                <span className="text-[0.5rem] uppercase tracking-[0.1em] text-text-tertiary mt-[1px]">of gross</span>
              </ArcGauge>
              <div className="flex-1 min-w-0">
                {metrics.returnRateSeries.length > 1 && <Sparkline draw points={metrics.returnRateSeries} width={104} height={32} />}
                <p className="text-[0.66rem] text-text-secondary mt-2 leading-[1.5]">
                  {formatEGP(metrics.returns)} came back as COD returns Shopify can't see.
                </p>
              </div>
            </div>
          </div>

          {/* Net revenue */}
          <div className={tileCls}>
            <div className="mb-4"><span className={tileLabelCls}>Net revenue</span></div>
            <div className="text-[1.7rem] font-light tracking-[-0.04em] text-text-primary leading-[1.1]">
              <CountUp value={metrics.netRevenue} format={formatEGP} />
            </div>
            {/* Kept vs returned — one pill, two lights */}
            <div className="flex h-[6px] rounded-full overflow-hidden bg-background4 mt-4" aria-hidden="true">
              <span
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${metrics.grossDelivered > 0 ? (metrics.netRevenue / metrics.grossDelivered) * 100 : 0}%`,
                  background: 'var(--ivy-accent)',
                  boxShadow: '0 0 8px var(--ivy-accent)',
                }}
              />
              <span
                className="h-full transition-[width] duration-700"
                style={{
                  width: `${metrics.grossDelivered > 0 ? (metrics.returns / metrics.grossDelivered) * 100 : 0}%`,
                  background: '#e07070',
                  opacity: 0.75,
                }}
              />
            </div>
            <p className="text-[0.66rem] text-text-secondary mt-2 leading-[1.5]">
              {formatEGP(metrics.grossDelivered)} delivered − {formatEGP(metrics.returns)} returned
            </p>
          </div>

          {/* Inventory vs target */}
          <button className={`${tileCls} text-left cursor-pointer transition-colors duration-200 hover:border-border-md`} onClick={() => router.push('/dashboard/ivy/inventory')}>
            <div className="flex items-center justify-between mb-4">
              <span className={tileLabelCls}>Inventory vs target</span>
              <svg className="w-[11px] h-[11px] text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
            </div>
            <div className="flex items-center gap-5">
              <ArcGauge pct={inventoryPct}>
                <CountUp
                  value={inventoryPct}
                  format={(n) => `${Math.round(n)}%`}
                  className="text-[1.05rem] font-light tracking-[-0.03em] text-text-primary"
                />
                <span className="text-[0.5rem] uppercase tracking-[0.1em] text-text-tertiary mt-[1px]">covered</span>
              </ArcGauge>
              <p className="flex-1 min-w-0 text-[0.66rem] text-text-secondary leading-[1.6]">
                Holding {formatEGP(state.inventory.inventory_value)} against the {formatEGP(state.target.sales_target)} target
                {inventoryGap > 0
                  ? <> — <span className="text-text-primary">{formatEGP(inventoryGap)} gap</span> to cover.</>
                  : <> — covered with {formatEGP(-inventoryGap)} to spare.</>}
              </p>
            </div>
          </button>
        </div>

        {/* Where the money went + what Ivy logged */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={tileCls}>
            <div className="flex items-baseline justify-between mb-5">
              <span className={tileLabelCls}>Where the money went</span>
              <button
                onClick={() => router.push('/dashboard/ivy/expenses')}
                className="text-[0.64rem] text-text-tertiary hover:text-text-primary transition-colors duration-150"
              >
                All expenses →
              </button>
            </div>
            {breakdown.length === 0 ? (
              <EmptyState text="no expenses logged in this period" />
            ) : (
              <div className="flex flex-col gap-[0.85rem]">
                {breakdown.slice(0, 5).map((b) => {
                  const share = breakdownTotal > 0 ? (b.total / breakdownTotal) * 100 : 0;
                  return (
                    <div key={b.category}>
                      <div className="flex items-center justify-between mb-[5px]">
                        <span className="text-[0.7rem] text-text-secondary">{EXPENSE_CATEGORY_LABEL[b.category]}</span>
                        <span className="text-[0.7rem] text-text-primary tabular-nums">{formatEGP(b.total)}</span>
                      </div>
                      <div className="h-[5px] rounded-full bg-background4 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-[width] duration-700"
                          style={{
                            width: `${share}%`,
                            background: 'linear-gradient(90deg, var(--ivy-accent-soft), var(--ivy-accent))',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={tileCls}>
            <div className="flex items-baseline justify-between mb-2">
              <span className={tileLabelCls}>What Ivy logged</span>
              <button
                onClick={() => router.push('/dashboard/ivy/activity')}
                className="text-[0.64rem] text-text-tertiary hover:text-text-primary transition-colors duration-150"
              >
                Full activity →
              </button>
            </div>
            {recentActivity.length === 0 ? (
              <EmptyState text="nothing logged yet" />
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {recentActivity.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => router.push('/dashboard/ivy/activity')}
                    className="group flex items-center gap-3 py-[0.68rem] text-left"
                  >
                    <span className="text-text-tertiary shrink-0 group-hover:text-text-secondary transition-colors duration-150">
                      <SourceIcon source={e.source} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[0.72rem] text-text-primary truncate">{e.note}</span>
                      <span className="block text-[0.62rem] text-text-tertiary mt-[1px]">
                        {EXPENSE_CATEGORY_LABEL[e.category]} · {timeAgo(e.spent_at)}
                      </span>
                    </span>
                    <span className="text-[0.72rem] text-text-primary tabular-nums shrink-0">−{formatEGP(e.amount)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </IvyShell>
  );
}
