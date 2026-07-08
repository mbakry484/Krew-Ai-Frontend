'use client';

import { useMemo, useState } from 'react';
import IvyShell from '../components/IvyShell';
import AddRevenueDrawer from '../components/AddRevenueDrawer';
import { channelColor } from '../components/channelColors';
import { AuraField, CountUp, ArcGauge } from '@/components/AuraSystem';
import { Delta, EmptyState, formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import {
  selectChannelBreakdown,
  selectPeriodMetrics,
  selectPreviousMetrics,
  selectRevenueEntries,
} from '@/lib/ivy/ivyClient';
import { IVY_PERIOD_LABEL, IvyPeriod, REVENUE_CHANNEL_KIND_LABEL } from '@/lib/ivy/types';

const PERIODS: IvyPeriod[] = ['this_month', 'last_month', 'last_90'];
const IVY_HUE = 152;

const tileCls = 'relative overflow-hidden rounded-[20px] border border-border bg-background p-6';
const tileLabelCls = 'text-[0.6rem] uppercase tracking-[0.09em] text-text-tertiary';

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export default function IvyRevenue() {
  const state = useIvy();
  const [period, setPeriod] = useState<IvyPeriod>('this_month');
  const [channelFilter, setChannelFilter] = useState<string | 'all'>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const metrics = useMemo(() => selectPeriodMetrics(state, period), [state, period]);
  const prev = useMemo(() => selectPreviousMetrics(state, period), [state, period]);
  const breakdown = useMemo(() => selectChannelBreakdown(state, period), [state, period]);
  const entries = useMemo(
    () => selectRevenueEntries(state, { period, channelId: channelFilter }),
    [state, period, channelFilter],
  );

  const revenueDelta = pctChange(metrics.netRevenue, prev.netRevenue);
  const activeChannels = breakdown.filter((b) => b.net > 0);
  const topChannel = activeChannels[0];
  const manualNet = activeChannels
    .filter((b) => b.channel.kind !== 'online')
    .reduce((s, b) => s + b.net, 0);
  const manualShare = metrics.netRevenue > 0 ? (manualNet / metrics.netRevenue) * 100 : 0;

  const channelById = (id: string) => state.revenueChannels.find((c) => c.id === id);

  const headerActions = (
    <>
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
      <button
        onClick={() => setDrawerOpen(true)}
        className="flex items-center gap-[6px] rounded-[9px] bg-btn-bg text-btn-text px-3 py-[7px] text-[0.72rem] font-medium hover:opacity-90 transition-opacity duration-150"
      >
        <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add revenue
      </button>
    </>
  );

  return (
    <IvyShell title="revenue" subtitle="every stream in — online, showrooms, stockists" actions={headerActions}>
      <div className="krew-stagger flex flex-col gap-5">

        {/* Hero — total net revenue + the channel mix as one bar of light */}
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-background">
          <AuraField hue={IVY_HUE} sat={55} anchor={330} lens />
          <div className="relative z-[1] p-8 max-md:p-6">
            <div className={tileLabelCls}>Net revenue — {IVY_PERIOD_LABEL[period]}</div>
            <div className="text-[3rem] max-md:text-[2.1rem] font-light tracking-[-0.045em] leading-[1.08] text-text-primary mt-2">
              <CountUp value={metrics.netRevenue} format={formatEGP} duration={1100} />
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {revenueDelta !== null && <Delta pct={revenueDelta} />}
              <span className="text-[0.7rem] text-text-secondary">
                {formatEGP(metrics.grossDelivered)} gross − {formatEGP(metrics.returns)} returns
                · {activeChannels.length} channel{activeChannels.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Channel mix — stacked light, one segment per channel */}
            {activeChannels.length > 0 && (
              <div className="mt-7 max-w-[640px]">
                <div className="flex h-[8px] rounded-full overflow-hidden bg-background4" aria-hidden="true">
                  {activeChannels.map((b) => (
                    <span
                      key={b.channel.id}
                      className="h-full transition-[width] duration-700 first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${b.sharePct}%`,
                        background: channelColor(state, b.channel.id),
                        boxShadow: `0 0 8px ${channelColor(state, b.channel.id, 0.7)}`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-x-4 gap-y-1 mt-3 flex-wrap">
                  {activeChannels.map((b) => (
                    <span key={b.channel.id} className="flex items-center gap-[6px] text-[0.64rem] text-text-secondary">
                      <span className="w-[7px] h-[7px] rounded-full" style={{ background: channelColor(state, b.channel.id) }} />
                      {b.channel.name}
                      <span className="text-text-tertiary tabular-nums">{Math.round(b.sharePct)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pulse row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Top channel */}
          <div className={tileCls}>
            <div className="mb-4"><span className={tileLabelCls}>Top channel</span></div>
            {topChannel ? (
              <div className="flex items-center gap-5">
                <ArcGauge pct={topChannel.sharePct} color={channelColor(state, topChannel.channel.id)}>
                  <CountUp
                    value={topChannel.sharePct}
                    format={(n) => `${Math.round(n)}%`}
                    className="text-[1.05rem] font-light tracking-[-0.03em] text-text-primary"
                  />
                  <span className="text-[0.5rem] uppercase tracking-[0.1em] text-text-tertiary mt-[1px]">of net</span>
                </ArcGauge>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.82rem] text-text-primary truncate">{topChannel.channel.name}</div>
                  <p className="text-[0.66rem] text-text-secondary mt-1 leading-[1.5]">
                    {formatEGP(topChannel.net)} net · {REVENUE_CHANNEL_KIND_LABEL[topChannel.channel.kind].toLowerCase()}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState text="no revenue in this period" />
            )}
          </div>

          {/* Beyond online */}
          <div className={tileCls}>
            <div className="mb-4"><span className={tileLabelCls}>Beyond online</span></div>
            <div className="text-[1.7rem] font-light tracking-[-0.04em] text-text-primary leading-[1.1]">
              <CountUp value={manualNet} format={formatEGP} />
            </div>
            <div className="h-[6px] rounded-full bg-background4 overflow-hidden mt-4" aria-hidden="true">
              <span
                className="block h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${manualShare}%`,
                  background: 'linear-gradient(90deg, var(--ivy-accent-soft), var(--ivy-accent))',
                  boxShadow: '0 0 8px var(--ivy-accent)',
                }}
              />
            </div>
            <p className="text-[0.66rem] text-text-secondary mt-2 leading-[1.5]">
              {Math.round(manualShare)}% of net revenue came from showrooms, stockists &amp; other offline channels.
            </p>
          </div>

          {/* Return drag */}
          <div className={tileCls}>
            <div className="mb-4"><span className={tileLabelCls}>Return drag</span></div>
            <div className="flex items-center gap-5">
              <ArcGauge pct={metrics.returnRatePct ?? 0} color={(metrics.returnRatePct ?? 0) >= 25 ? '#e07070' : 'var(--ivy-accent)'}>
                <CountUp
                  value={metrics.returnRatePct ?? 0}
                  format={(n) => `${n.toFixed(1)}%`}
                  className="text-[1.05rem] font-light tracking-[-0.03em] text-text-primary"
                />
                <span className="text-[0.5rem] uppercase tracking-[0.1em] text-text-tertiary mt-[1px]">online</span>
              </ArcGauge>
              <p className="flex-1 min-w-0 text-[0.66rem] text-text-secondary leading-[1.6]">
                {formatEGP(metrics.returns)} of online COD deliveries came back — offline channels don&apos;t carry this risk.
              </p>
            </div>
          </div>
        </div>

        {/* Revenue log */}
        <div className={tileCls}>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <span className={tileLabelCls}>Revenue log</span>
            <div className="flex flex-wrap gap-[5px]" role="radiogroup" aria-label="Filter by channel">
              {(['all', ...state.revenueChannels.map((c) => c.id)] as const).map((id) => {
                const active = channelFilter === id;
                const c = id === 'all' ? null : channelById(id);
                return (
                  <button
                    key={id}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setChannelFilter(id)}
                    className={`flex items-center gap-[6px] px-[10px] py-[4px] rounded-full border text-[0.64rem] transition-all duration-150 ${
                      active
                        ? 'border-border-hover bg-background3 text-text-primary'
                        : 'border-border text-text-tertiary hover:border-border-md hover:text-text-secondary'
                    }`}
                  >
                    {c && <span className="w-[6px] h-[6px] rounded-full" style={{ background: channelColor(state, c.id) }} />}
                    {c ? c.name : 'All'}
                  </button>
                );
              })}
            </div>
          </div>

          {entries.length === 0 ? (
            <EmptyState text="no revenue logged for this filter" />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {entries.map((e) => {
                const c = channelById(e.channel_id);
                return (
                  <div key={e.id} className="flex items-center gap-3 py-[0.72rem]">
                    <span
                      className="w-[8px] h-[8px] rounded-full shrink-0"
                      style={{ background: channelColor(state, e.channel_id), boxShadow: `0 0 6px ${channelColor(state, e.channel_id, 0.6)}` }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-[0.73rem] text-text-primary truncate">{c?.name ?? 'Unknown channel'}</span>
                        <span className="text-[0.55rem] uppercase tracking-[0.07em] px-[6px] py-[1px] rounded-full border border-border text-text-tertiary shrink-0">
                          {e.source === 'manual' ? 'Manual' : 'Auto · Bosta'}
                        </span>
                      </span>
                      <span className="block text-[0.62rem] text-text-tertiary mt-[2px]">
                        {formatDay(e.date)}
                        {e.returns > 0 && <> · {formatEGP(e.gross_delivered)} gross − {formatEGP(e.returns)} returns</>}
                      </span>
                    </span>
                    <span className="text-[0.75rem] text-text-primary tabular-nums shrink-0">+{formatEGP(e.net_revenue)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {drawerOpen && <AddRevenueDrawer state={state} onClose={() => setDrawerOpen(false)} />}
    </IvyShell>
  );
}
