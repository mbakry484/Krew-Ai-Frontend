'use client';

import { useMemo, useState } from 'react';
import IvyShell from '../components/IvyShell';
import { channelColor } from '../components/channelColors';
import { downloadReportCsv, openReportPdf, ReportMeta } from './exporters';
import DashboardModal from '@/components/DashboardModal';
import { AuraField, ArcGauge, CountUp } from '@/components/AuraSystem';
import { Delta, EmptyState, formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import {
  periodRange,
  selectCashRemaining,
  selectChannelBreakdown,
  selectPeriodMetrics,
  selectPnL,
  selectPreviousMetrics,
} from '@/lib/ivy/ivyClient';
import {
  EXPENSE_CATEGORY_LABEL,
  IVY_PERIOD_LABEL,
  IvyPeriod,
  REVENUE_CHANNEL_KIND_LABEL,
} from '@/lib/ivy/types';

const PERIODS: IvyPeriod[] = ['this_month', 'last_month', 'last_90'];
const IVY_HUE = 152;

const tileCls = 'relative overflow-hidden rounded-[20px] border border-border bg-background p-6';
const tileLabelCls = 'text-[0.6rem] uppercase tracking-[0.09em] text-text-tertiary';

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function rangeLabel(period: IvyPeriod): string {
  const { start, end } = periodRange(period);
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

// ── Statement row — pure typography, staggered reveal ─────────────────────────
function PnlRow({
  label,
  value,
  index,
  sub = false,
  total = false,
  negative = false,
  dot,
}: {
  label: string;
  value: string;
  index: number;
  sub?: boolean;
  total?: boolean;
  negative?: boolean;
  dot?: string;
}) {
  return (
    <div
      className={`pnl-row flex items-center justify-between gap-4 py-[0.62rem] ${
        total ? 'border-t border-border-md' : 'border-t border-border first:border-t-0'
      }`}
      style={{ animationDelay: `${140 + index * 45}ms` }}
    >
      <span className={`flex items-center gap-[8px] text-[0.74rem] ${sub ? 'text-text-secondary pl-4' : 'text-text-primary'} ${total ? 'font-medium' : ''}`}>
        {dot && <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: dot, boxShadow: `0 0 5px ${dot}` }} />}
        {label}
      </span>
      <span className={`text-[0.76rem] tabular-nums shrink-0 ${negative ? 'text-[#e07070]' : 'text-text-primary'} ${total ? 'font-medium' : ''}`}>
        {value}
      </span>
    </div>
  );
}

// ── Export modal — real files, branded ────────────────────────────────────────
function ExportModal({
  onClose,
  onExport,
  periodLabel,
}: {
  onClose: () => void;
  onExport: (format: 'pdf' | 'excel') => void;
  periodLabel: string;
}) {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');

  const FORMATS = [
    {
      id: 'pdf' as const,
      label: 'Branded PDF',
      desc: 'clean Krew-branded statement, ready to share with partners or accountants',
      icon: <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 15h6M9 11h3" />,
    },
    {
      id: 'excel' as const,
      label: 'Excel',
      desc: 'every P&L line as raw rows — pivot, model, or hand to finance',
      icon: <path d="M9 17v-2m3 2v-4m3 4v-6M4 6h16M6 6v14a2 2 0 002 2h8a2 2 0 002-2V6" />,
    },
  ];

  return (
    <DashboardModal onClose={onClose} labelledBy="report-export-title" variant="center">
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div id="report-export-title" className="text-[1.05rem] font-medium tracking-[-0.02em] text-text-primary">Export report</div>
        <p className="text-[0.68rem] text-text-secondary mt-[2px]">P&amp;L statement · {periodLabel}</p>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          {FORMATS.map((f) => {
            const active = format === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                aria-pressed={active}
                className={`text-left rounded-[12px] border p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 ${
                  active ? 'border-border-hover bg-background2' : 'border-border hover:border-border-md'
                }`}
              >
                <svg className={`w-[16px] h-[16px] mb-2 transition-colors duration-150 ${active ? 'text-ivy-accent' : 'text-text-tertiary'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                <div className="text-[0.76rem] text-text-primary font-medium">{f.label}</div>
                <div className="text-[0.62rem] text-text-tertiary mt-[2px] leading-[1.45]">{f.desc}</div>
              </button>
            );
          })}
        </div>
        <p className="text-[0.62rem] text-text-tertiary mt-4 leading-[1.5]">
          Exports use the period selected on the page — switch it there to export a different window.
        </p>
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-[8px] text-[0.74rem] text-text-secondary border border-border hover:border-border-md hover:text-text-primary transition-all duration-150"
        >
          Cancel
        </button>
        <button
          onClick={() => onExport(format)}
          className="px-4 py-2 rounded-[8px] text-[0.74rem] font-medium bg-btn-bg text-btn-text hover:opacity-85 transition-opacity duration-150"
        >
          {format === 'pdf' ? 'Generate PDF' : 'Download Excel'}
        </button>
      </div>
    </DashboardModal>
  );
}

export default function IvyReports() {
  const state = useIvy();
  const [period, setPeriod] = useState<IvyPeriod>('this_month');
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const pnl = useMemo(() => selectPnL(state, period), [state, period]);
  const prev = useMemo(() => selectPreviousMetrics(state, period), [state, period]);
  const metrics = useMemo(() => selectPeriodMetrics(state, period), [state, period]);
  const cash = useMemo(() => selectCashRemaining(state), [state]);
  const mix = useMemo(() => selectChannelBreakdown(state, period).filter((b) => b.net > 0), [state, period]);

  const profitDelta = pctChange(pnl.netProfit, prev.netProfit);
  const expenseRatio = pnl.netRevenue > 0 ? (pnl.totalExpenses / pnl.netRevenue) * 100 : null;
  // Burn/runway always measured on the trailing 90 days — stable, not period-dependent.
  const burn = useMemo(() => selectPeriodMetrics(state, 'last_90').expensesTotal / 3, [state]);
  const runway = burn > 0 ? cash.remaining / burn : null;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const meta: ReportMeta = {
      periodLabel: IVY_PERIOD_LABEL[period],
      rangeLabel: rangeLabel(period),
      generatedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      metrics: {
        marginPct: pnl.marginPct,
        expenseRatioPct: expenseRatio,
        returnRatePct: metrics.returnRatePct,
        cashRemaining: cash.remaining,
        runwayMonths: runway,
      },
    };
    if (format === 'excel') {
      downloadReportCsv(pnl, meta);
      showToast('Excel file downloaded');
    } else {
      const ok = openReportPdf(pnl, meta);
      showToast(ok ? 'Branded PDF ready — save it from the print dialog' : 'Allow pop-ups to generate the PDF');
    }
    setExportOpen(false);
  };

  // Row index counter so the whole statement cascades top-to-bottom.
  let rowIdx = 0;

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
        onClick={() => setExportOpen(true)}
        className="flex items-center gap-[6px] rounded-[9px] bg-btn-bg text-btn-text px-3 py-[7px] text-[0.72rem] font-medium hover:opacity-90 transition-opacity duration-150"
      >
        <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        Export
      </button>
    </>
  );

  return (
    <IvyShell title="reports" subtitle="the P&L, margins, and runway — export-ready" actions={headerActions}>
      <div className="krew-stagger flex flex-col gap-5">

        {/* Hero — the bottom line */}
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-background">
          <AuraField hue={IVY_HUE} sat={55} anchor={210} lens alert={pnl.netProfit < 0} />
          <div className="relative z-[1] p-8 max-md:p-6 grid lg:grid-cols-[1fr_auto] gap-x-12 gap-y-8 items-center">
            <div>
              <div className={tileLabelCls}>Net profit — {IVY_PERIOD_LABEL[period]}</div>
              <div className="text-[3rem] max-md:text-[2.1rem] font-light tracking-[-0.045em] leading-[1.08] text-text-primary mt-2">
                <CountUp value={pnl.netProfit} format={formatEGP} duration={1100} />
              </div>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {profitDelta !== null && <Delta pct={profitDelta} />}
                <span className="text-[0.7rem] text-text-secondary">
                  {formatEGP(pnl.netRevenue)} net revenue − {formatEGP(pnl.totalExpenses)} operating expenses · {rangeLabel(period)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 max-lg:justify-start">
              <ArcGauge pct={Math.max(0, pnl.marginPct ?? 0)} size={128} stroke={8} color={pnl.netProfit >= 0 ? 'var(--ivy-accent)' : '#e07070'}>
                <CountUp
                  value={pnl.marginPct ?? 0}
                  format={(n) => `${n.toFixed(1)}%`}
                  className="text-[1.3rem] font-light tracking-[-0.03em] text-text-primary"
                />
                <span className="text-[0.52rem] uppercase tracking-[0.1em] text-text-tertiary mt-[2px]">net margin</span>
              </ArcGauge>
            </div>
          </div>
        </div>

        {/* Pulse row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Expense ratio */}
          <div className={tileCls}>
            <div className="mb-4"><span className={tileLabelCls}>Expense ratio</span></div>
            <div className="flex items-center gap-5">
              <ArcGauge pct={Math.min(100, expenseRatio ?? 0)} color={(expenseRatio ?? 0) >= 60 ? '#e07070' : 'var(--ivy-accent)'}>
                <CountUp
                  value={expenseRatio ?? 0}
                  format={(n) => `${n.toFixed(0)}%`}
                  className="text-[1.05rem] font-light tracking-[-0.03em] text-text-primary"
                />
                <span className="text-[0.5rem] uppercase tracking-[0.1em] text-text-tertiary mt-[1px]">of net rev</span>
              </ArcGauge>
              <p className="flex-1 min-w-0 text-[0.66rem] text-text-secondary leading-[1.6]">
                Every EGP 100 of net revenue costs <span className="text-text-primary tabular-nums">{formatEGP(expenseRatio !== null ? Math.round(expenseRatio) : 0).replace('EGP ', 'EGP ')}</span> to run.
              </p>
            </div>
          </div>

          {/* Cash runway */}
          <div className={tileCls}>
            <div className="mb-4"><span className={tileLabelCls}>Cash runway</span></div>
            <div className="flex items-baseline gap-2">
              <CountUp
                value={runway ?? 0}
                format={(n) => n.toFixed(1)}
                className="text-[1.7rem] font-light tracking-[-0.04em] text-text-primary leading-[1.1]"
              />
              <span className="text-[0.7rem] text-text-tertiary">months</span>
            </div>
            <div className="h-[6px] rounded-full bg-background4 overflow-hidden mt-4" aria-hidden="true">
              <span
                className="block h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${Math.min(100, ((runway ?? 0) / 6) * 100)}%`,
                  background: (runway ?? 0) < 1.5 ? '#e07070' : 'var(--ivy-accent)',
                  boxShadow: `0 0 8px ${(runway ?? 0) < 1.5 ? '#e07070' : 'var(--ivy-accent)'}`,
                }}
              />
            </div>
            <p className="text-[0.66rem] text-text-secondary mt-2 leading-[1.5]">
              {formatEGP(cash.remaining)} in pools at ~{formatEGP(Math.round(burn))}/month burn (trailing 90 days).
            </p>
          </div>

          {/* Revenue mix */}
          <div className={tileCls}>
            <div className="mb-4"><span className={tileLabelCls}>Revenue mix</span></div>
            {mix.length === 0 ? (
              <EmptyState text="no revenue in this period" />
            ) : (
              <>
                <div className="flex h-[8px] rounded-full overflow-hidden bg-background4" aria-hidden="true">
                  {mix.map((b) => (
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
                <div className="flex flex-col gap-[6px] mt-4">
                  {mix.map((b) => (
                    <div key={b.channel.id} className="flex items-center gap-2 text-[0.66rem]">
                      <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: channelColor(state, b.channel.id) }} />
                      <span className="flex-1 min-w-0 text-text-secondary truncate">{b.channel.name}</span>
                      <span className="text-text-primary tabular-nums">{Math.round(b.sharePct)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* P&L statement — the centerpiece */}
        <div className={`${tileCls} max-w-[760px] w-full mx-auto lg:p-8`}>
          <div className="flex items-baseline justify-between mb-1">
            <div>
              <div className="text-[1.05rem] font-light tracking-[-0.02em] text-text-primary">Profit &amp; Loss</div>
              <div className="text-[0.64rem] text-text-tertiary mt-[2px]">{IVY_PERIOD_LABEL[period]} · {rangeLabel(period)}</div>
            </div>
            <button
              onClick={() => setExportOpen(true)}
              className="text-[0.64rem] text-text-tertiary hover:text-text-primary transition-colors duration-150 shrink-0"
            >
              Export →
            </button>
          </div>

          {/* Revenue */}
          <div className="text-[0.58rem] uppercase tracking-[0.12em] text-ivy-accent mt-6 mb-1">Revenue</div>
          <div>
            {pnl.revenue.map((r) => (
              <PnlRow
                key={r.channel.id}
                index={rowIdx++}
                sub
                dot={channelColor(state, r.channel.id)}
                label={`${r.channel.name} — ${REVENUE_CHANNEL_KIND_LABEL[r.channel.kind]}`}
                value={formatEGP(r.gross)}
              />
            ))}
            <PnlRow index={rowIdx++} total label="Gross revenue" value={formatEGP(pnl.grossRevenue)} />
            <PnlRow index={rowIdx++} sub negative label="Returns (COD)" value={`(${formatEGP(pnl.totalReturns)})`} />
            <PnlRow index={rowIdx++} total label="Net revenue" value={formatEGP(pnl.netRevenue)} />
          </div>

          {/* Expenses */}
          <div className="text-[0.58rem] uppercase tracking-[0.12em] text-ivy-accent mt-7 mb-1">Operating expenses</div>
          <div>
            {pnl.expenses.length === 0 ? (
              <PnlRow index={rowIdx++} sub label="No expenses in this period" value="—" />
            ) : (
              pnl.expenses.map((e) => (
                <PnlRow
                  key={e.category}
                  index={rowIdx++}
                  sub
                  negative
                  label={EXPENSE_CATEGORY_LABEL[e.category]}
                  value={`(${formatEGP(e.total)})`}
                />
              ))
            )}
            <PnlRow index={rowIdx++} total negative label="Total operating expenses" value={`(${formatEGP(pnl.totalExpenses)})`} />
          </div>

          {/* Bottom line */}
          <div
            className="pnl-row flex items-center justify-between gap-4 mt-7 rounded-[14px] border px-5 py-4"
            style={{
              animationDelay: `${140 + rowIdx * 45}ms`,
              borderColor: pnl.netProfit >= 0 ? 'var(--ivy-accent-border)' : 'rgba(224,112,112,0.4)',
              background: pnl.netProfit >= 0 ? 'var(--ivy-accent-soft)' : 'rgba(224,112,112,0.08)',
            }}
          >
            <span className="text-[0.66rem] uppercase tracking-[0.1em] text-text-secondary">Net profit</span>
            <span className="flex items-baseline gap-2">
              <CountUp
                value={pnl.netProfit}
                format={formatEGP}
                className={`text-[1.3rem] font-light tracking-[-0.03em] ${pnl.netProfit >= 0 ? 'text-ivy-accent' : 'text-[#e07070]'}`}
              />
              {pnl.marginPct !== null && (
                <span className="text-[0.66rem] text-text-tertiary tabular-nums">· {pnl.marginPct.toFixed(1)}% margin</span>
              )}
            </span>
          </div>
        </div>

      </div>

      {exportOpen && (
        <ExportModal
          onClose={() => setExportOpen(false)}
          onExport={handleExport}
          periodLabel={`${IVY_PERIOD_LABEL[period]} · ${rangeLabel(period)}`}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] bg-background border border-border-md rounded-full px-5 py-[0.6rem] text-[0.72rem] text-text-primary shadow-[0_12px_32px_rgba(0,0,0,0.25)] motion-safe:animate-[krew-rise_0.3s_cubic-bezier(0.22,1,0.36,1)]">
          {toast}
        </div>
      )}

      <style jsx global>{`
        /* P&L rows cascade in top-to-bottom; re-runs on period change because
           the statement re-mounts through React keys on the data. */
        .pnl-row {
          animation: pnl-row-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes pnl-row-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pnl-row { animation: none; }
        }
      `}</style>
    </IvyShell>
  );
}
