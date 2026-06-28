'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';
import LunaTopBarActions from '@/components/LunaTopBarActions';

import { getReportsData, type TimeRange, type DrillRow } from './mockReportsData';
import StatCard from './components/StatCard';
import DrillDownPanel from './components/DrillDownPanel';
import ExportModal from './components/ExportModal';
import TrendLine from './components/TrendLine';
import Heatmap from './components/Heatmap';
import RankedList from './components/RankedList';
import {
  SectionCard,
  SkeletonRows,
  EmptyState,
  formatEGP,
  formatDuration,
  INTENT_LABEL,
} from './components/_shared';

type RangeOption = TimeRange | 'custom';
const RANGE_TABS: { id: RangeOption; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'custom', label: 'Custom' },
];

// Each hero card's drill-down metadata, keyed to mockReportsData.drilldowns.
const DRILL_META: Record<string, { title: string; subtitle: string }> = {
  lunaRevenue: { title: 'Luna-attributed revenue', subtitle: 'orders Luna closed in DMs' },
  resolutionRate: { title: 'Resolution rate', subtitle: 'conversations counted in the rate' },
  avgTimeToResolutionSec: { title: 'Time to resolution', subtitle: 'slowest-to-fastest resolutions' },
  refundDeflectionRate: { title: 'Refund deflection', subtitle: 'refund requests turned into exchanges' },
};

export default function ReportsPage() {
  const router = useRouter();
  const [range, setRange] = useState<RangeOption>('30d');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Drill-down + export modal state
  const [drillKey, setDrillKey] = useState<string | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Custom range falls back to the 30d sample dataset (no custom mock yet).
  const dataRange: TimeRange = range === 'custom' ? '30d' : range;
  const data = useMemo(() => getReportsData(dataRange), [dataRange]);

  useEffect(() => {
    if (!isLoggedIn()) router.push('/auth/login');
  }, [router]);

  // Re-key the page when the range changes — simulate the fetch latency so the
  // skeletons are exercised. Swap this for the real fetch when the data lands.
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(t);
  }, [dataRange]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const openDrill = useCallback((key: string) => {
    setDrillKey(key);
    setDrillLoading(true);
    window.setTimeout(() => setDrillLoading(false), 320);
  }, []);

  const openConversation = useCallback((row: DrillRow) => {
    // Stub: a real build would deep-link into Conversations with this convo open.
    showToast(`would open ${row.customer}'s conversation`);
  }, [showToast]);

  const drillRows = drillKey ? data.drilldowns[drillKey] ?? [] : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 gap-3 p-3 max-md:pt-[60px]">
        <LunaSidebar />

        <main className="flex-1 rounded-2xl border border-border overflow-y-auto bg-background2">
          {/* ── Top bar ── */}
          <div className="flex items-start justify-between px-8 max-md:px-4 pt-[1.6rem] pb-0 flex-wrap gap-3">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">reports</h2>
              <p className="text-[0.72rem] text-text-secondary">performance data and exports</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Time-range selector */}
              <div className="inline-flex rounded-[9px] border border-border p-[3px] bg-background" role="tablist" aria-label="Time range">
                {RANGE_TABS.map((t) => {
                  const active = range === t.id;
                  return (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setRange(t.id)}
                      className={`px-3 py-[5px] rounded-[6px] text-[0.7rem] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 ${
                        active ? 'bg-background2 text-text-primary border border-border-md' : 'text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Export button */}
              <button
                onClick={() => setExportOpen(true)}
                className="flex items-center gap-[6px] rounded-[9px] border border-border-md px-3 py-[7px] text-[0.72rem] text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
              >
                <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export
              </button>

              <div className="max-md:hidden"><LunaTopBarActions /></div>
            </div>
          </div>

          {/* Custom range hint */}
          {range === 'custom' && (
            <div className="px-8 max-md:px-4 mt-3">
              <div className="text-[0.64rem] text-text-tertiary border border-border rounded-[8px] bg-background px-3 py-2 inline-block">
                custom range previews the 30-day sample — wire a date picker to live data later
              </div>
            </div>
          )}

          <div className="px-8 max-md:px-4 py-6 pb-14 flex flex-col gap-6">

            {/* ── Row 1 — hero stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                [0, 1, 2, 3].map((i) => <div key={i} className="bg-background border border-border rounded-[12px] h-[170px] motion-safe:animate-pulse" />)
              ) : (
                <>
                  <StatCard
                    label="Luna revenue"
                    value={formatEGP(data.hero.lunaRevenue.value)}
                    sublabel={`${data.hero.lunaRevenue.orderCount} orders taken by Luna (DM)`}
                    deltaPct={data.hero.lunaRevenue.deltaPct}
                    icon={<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>}
                    onClick={() => openDrill('lunaRevenue')}
                  />
                  <StatCard
                    label="Resolution rate"
                    value={`${data.hero.resolutionRate.value}%`}
                    deltaPct={data.hero.resolutionRate.deltaPct}
                    icon={<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    onClick={() => openDrill('resolutionRate')}
                    breakdown={
                      <div className="flex items-center justify-between text-[0.6rem] text-text-tertiary">
                        <span><span className="text-text-secondary">{data.hero.resolutionRate.resolvedByLuna}</span> luna</span>
                        <span><span className="text-text-secondary">{data.hero.resolutionRate.escalated}</span> escalated</span>
                        <span><span className="text-text-secondary">{data.hero.resolutionRate.abandoned}</span> abandoned</span>
                      </div>
                    }
                  />
                  <StatCard
                    label="Avg time to resolution"
                    value={formatDuration(data.hero.avgTimeToResolutionSec.value)}
                    sublabel="full resolution time"
                    deltaPct={data.hero.avgTimeToResolutionSec.deltaPct}
                    lowerIsBetter
                    icon={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}
                    onClick={() => openDrill('avgTimeToResolutionSec')}
                  />
                  <StatCard
                    label="Refund deflection"
                    value={`${data.hero.refundDeflectionRate.value}%`}
                    sublabel="refunds turned into exchanges"
                    deltaPct={data.hero.refundDeflectionRate.deltaPct}
                    emphasis
                    icon={<><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></>}
                    onClick={() => openDrill('refundDeflectionRate')}
                  />
                </>
              )}
            </div>

            {/* ── Row 2 — commercial impact ── */}
            <SectionCard title="Commercial impact" subtitle="what Luna moved in revenue this period">
              {loading ? (
                <SkeletonRows count={1} height={96} />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <CommercialBlock label="Orders taken by Luna" big={String(data.commercial.ordersByLuna.count)} sub={`${formatEGP(data.commercial.ordersByLuna.totalValue)} total`} />
                  <CommercialBlock label="Exchanges processed" big={String(data.commercial.exchangesProcessed.count)} sub={`${formatEGP(data.commercial.exchangesProcessed.valueRetained)} retained`} tone="good" />
                  <CommercialBlock label="Refunds processed" big={String(data.commercial.refundsProcessed.count)} sub={`${formatEGP(data.commercial.refundsProcessed.valueLost)} lost`} tone="bad" />
                  <div className="rounded-[10px] border border-[#6bcf8f]/30 bg-[#6bcf8f]/[0.06] p-4 flex flex-col justify-between">
                    <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary">Refund deflection</div>
                    <div className="text-[1.5rem] font-light tracking-[-0.04em] text-text-primary mt-1">{data.commercial.refundDeflection.deflectionPct}%</div>
                    <div className="text-[0.64rem] text-[#3f9c63] dark:text-[#6bcf8f] leading-[1.45] mt-1">
                      Luna saved you <span className="font-medium">{formatEGP(data.commercial.refundDeflection.revenueSaved)}</span> in refunds this period.
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ── Row 3 — resolution quality ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SectionCard title="Resolution by intent" subtitle="how Luna does per request type">
                {loading ? <SkeletonRows count={4} height={28} /> : (
                  <div className="flex flex-col gap-[0.85rem] mt-1">
                    {data.quality.resolutionByIntent.map((r) => (
                      <div key={r.intent}>
                        <div className="flex justify-between text-[0.7rem] mb-[5px]">
                          <span className="text-text-secondary">{INTENT_LABEL[r.intent]}</span>
                          <span className="text-text-tertiary tabular-nums">{r.rate}%</span>
                        </div>
                        <div className="bg-border rounded-[3px] h-[5px] overflow-hidden">
                          <div className="h-full rounded-[3px] bg-text-secondary" style={{ width: `${r.rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Messages to resolution" subtitle="fewer is better — loop-fix progress">
                {loading ? <SkeletonRows count={1} height={120} /> : (
                  <>
                    <div className="flex items-end gap-2 mb-2">
                      <div className="text-[2rem] font-light tracking-[-0.04em] text-text-primary leading-none">{data.quality.avgMessagesToResolution.value}</div>
                      <div className="text-[0.62rem] text-text-tertiary mb-1">avg messages</div>
                    </div>
                    <TrendLine
                      labels={data.quality.avgMessagesToResolution.trend.map(() => '')}
                      series={[{ name: 'avg', color: 'var(--text-secondary)', values: data.quality.avgMessagesToResolution.trend }]}
                      height={80}
                      showLegend={false}
                      showAxis={false}
                    />
                  </>
                )}
              </SectionCard>

              <SectionCard title="Slowest conversations" subtitle="outliers dragging the average">
                {loading ? <SkeletonRows count={3} height={44} /> : data.quality.slowestConversations.length === 0 ? (
                  <EmptyState text="no slow conversations this period" />
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.quality.slowestConversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => openConversation(c)}
                        className="flex items-center justify-between gap-2 bg-background2 border border-border rounded-[8px] px-3 py-[0.6rem] hover:border-border-md transition-colors text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                      >
                        <span className="min-w-0">
                          <span className="block text-[0.7rem] text-text-primary truncate">{c.customer}</span>
                          <span className="block text-[0.6rem] text-text-tertiary">{INTENT_LABEL[c.intent]}</span>
                        </span>
                        <span className="text-[0.7rem] text-text-secondary tabular-nums shrink-0">{formatDuration(c.durationSec || 0)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* ── Row 4 — issues & sentiment as trends ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SectionCard title="Issue categories trend" subtitle="how complaint types move over time">
                {loading ? <SkeletonRows count={1} height={150} /> : (
                  <TrendLine labels={data.trends.issueCategories.labels} series={data.trends.issueCategories.series} height={130} />
                )}
              </SectionCard>

              <SectionCard title="Sentiment trend" subtitle={data.trends.sentiment.summary}>
                {loading ? <SkeletonRows count={1} height={150} /> : (
                  <TrendLine labels={data.trends.sentiment.labels} series={data.trends.sentiment.series} height={130} yMax={100} />
                )}
              </SectionCard>

              <SectionCard title="Recurring clusters" subtitle="same complaint, many customers">
                {loading ? <SkeletonRows count={3} height={40} /> : data.trends.recurringClusters.length === 0 ? (
                  <EmptyState text="no recurring clusters yet" />
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.trends.recurringClusters.map((c) => (
                      <div key={c.label} className="flex items-center gap-3 bg-background2 border border-border rounded-[8px] px-3 py-[0.6rem]">
                        <span className="text-[1rem] font-light text-text-primary tabular-nums min-w-[20px]">{c.count}</span>
                        <span className="flex-1 text-[0.7rem] text-text-secondary leading-[1.35]">{c.label}</span>
                        <ClusterTrend trend={c.trend} pct={c.changePct} />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* ── Row 5 — customer & demand signals ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Top questions" subtitle="ranked by frequency">
                {loading ? <SkeletonRows count={4} height={30} /> : <RankedList items={data.demand.topQuestions} />}
              </SectionCard>
              <SectionCard title="Most-asked products" subtitle="what customers DM about">
                {loading ? <SkeletonRows count={4} height={30} /> : <RankedList items={data.demand.topProducts} />}
              </SectionCard>
            </div>

            <SectionCard title="Peak DM hours" subtitle="when customers message — day × hour">
              {loading ? <SkeletonRows count={1} height={160} /> : <Heatmap data={data.demand.peakHours} />}
            </SectionCard>

            <SectionCard title="Knowledge gaps" subtitle="high-intent questions Luna couldn't answer">
              {loading ? <SkeletonRows count={3} height={48} /> : data.demand.knowledgeGaps.length === 0 ? (
                <EmptyState text="no knowledge gaps — Luna answered everything" />
              ) : (
                <div className="flex flex-col gap-2">
                  {data.demand.knowledgeGaps.map((g) => (
                    <div key={g.id} className="flex items-center gap-3 bg-background2 border border-border rounded-[8px] px-4 py-[0.7rem]">
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.73rem] text-text-primary truncate">{g.query}</div>
                        <div className="text-[0.6rem] text-text-tertiary mt-[1px]">asked {g.count}× · {Math.round(g.intentScore * 100)}% purchase intent</div>
                      </div>
                      <button
                        onClick={() => showToast(`teaching Luna: "${g.query}" — opening Customize (stub)`)}
                        className="shrink-0 rounded-full border border-border-md px-3 py-[5px] text-[0.64rem] text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                      >
                        teach Luna
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

          </div>
        </main>
      </div>

      {/* ── Drill-down panel ── */}
      {drillKey && (
        <DrillDownPanel
          title={DRILL_META[drillKey]?.title ?? 'Conversations'}
          subtitle={`${DRILL_META[drillKey]?.subtitle ?? ''} · ${data.rangeLabel}`}
          rows={drillRows}
          loading={drillLoading}
          onClose={() => setDrillKey(null)}
          onOpenConversation={openConversation}
        />
      )}

      {/* ── Export modal ── */}
      {exportOpen && (
        <ExportModal initialRange={dataRange} onClose={() => setExportOpen(false)} onToast={showToast} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] bg-background border border-border-md rounded-[10px] px-4 py-2 text-[0.72rem] text-text-primary shadow-[0_8px_32px_rgba(0,0,0,0.25)] motion-safe:animate-[reportFade_0.2s_ease-out]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Small local presentational helpers ───────────────────────────────────────
function CommercialBlock({ label, big, sub, tone }: { label: string; big: string; sub: string; tone?: 'good' | 'bad' }) {
  const subColor = tone === 'good' ? 'text-[#3f9c63] dark:text-[#6bcf8f]' : tone === 'bad' ? 'text-[#c45c5c]' : 'text-text-tertiary';
  return (
    <div className="rounded-[10px] border border-border bg-background2 p-4 flex flex-col justify-between">
      <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary">{label}</div>
      <div className="text-[1.5rem] font-light tracking-[-0.04em] text-text-primary mt-1">{big}</div>
      <div className={`text-[0.64rem] mt-1 ${subColor}`}>{sub}</div>
    </div>
  );
}

function ClusterTrend({ trend, pct }: { trend: 'up' | 'down' | 'flat'; pct: number }) {
  if (trend === 'flat') return <span className="text-[0.64rem] text-text-tertiary shrink-0">±0%</span>;
  const up = trend === 'up';
  // Rising recurring complaints are bad (red); falling is good (green).
  return (
    <span className={`text-[0.64rem] flex items-center gap-[3px] shrink-0 ${up ? 'text-[#e07070]' : 'text-[#6bcf8f]'}`}>
      {up ? (
        <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
      ) : (
        <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7l10 10M17 7v10H7" /></svg>
      )}
      {up ? '+' : ''}{pct}%
    </span>
  );
}
