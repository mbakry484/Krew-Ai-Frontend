'use client';

import { useMemo, useState } from 'react';
import IvyShell from '../components/IvyShell';
import AddExpenseDrawer from '../components/AddExpenseDrawer';
import { IvyStatCard, ProgressBar, SourceIcon } from '../components/_ivyShared';
import { SectionCard, EmptyState, formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_SOURCES,
  EXPENSE_SOURCE_LABEL,
  ExpenseCategory,
  ExpenseSource,
} from '@/lib/ivy/types';

type CategoryFilter = ExpenseCategory | 'all';
type SourceFilter = ExpenseSource | 'all';

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function IvyExpenses() {
  const state = useIvy();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Hero metrics reflect ALL expenses (a stable summary), not the filters ──
  const hero = useMemo(() => {
    const all = state.expenses;
    const total = all.reduce((s, e) => s + e.amount, 0);
    const byCat = new Map<ExpenseCategory, number>();
    for (const e of all) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
    const top = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])[0];
    return {
      total,
      count: all.length,
      avg: all.length ? Math.round(total / all.length) : 0,
      topCategory: top ? top[0] : null,
      topAmount: top ? top[1] : 0,
      topPct: top && total > 0 ? Math.round((top[1] / total) * 100) : 0,
    };
  }, [state.expenses]);

  const filtered = useMemo(
    () =>
      state.expenses
        .filter((e) => categoryFilter === 'all' || e.category === categoryFilter)
        .filter((e) => sourceFilter === 'all' || e.source === sourceFilter)
        .sort((a, b) => b.spent_at.localeCompare(a.spent_at)),
    [state.expenses, categoryFilter, sourceFilter],
  );

  // Breakdown chart respects the source filter; clicking a bar filters the list.
  const breakdown = useMemo(() => {
    const totals = new Map<ExpenseCategory, number>();
    for (const e of state.expenses) {
      if (sourceFilter !== 'all' && e.source !== sourceFilter) continue;
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [state.expenses, sourceFilter]);

  const breakdownMax = breakdown.reduce((m, b) => Math.max(m, b.total), 0);
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  const addButton = (
    <button
      onClick={() => setDrawerOpen(true)}
      className="flex items-center gap-[6px] rounded-[9px] bg-btn-bg text-btn-text px-3 py-[7px] text-[0.72rem] font-medium hover:opacity-90 transition-opacity duration-150"
    >
      <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
      Add expense
    </button>
  );

  return (
    <IvyShell title="expenses" subtitle="every pound out, categorized and traceable" actions={addButton}>
      {/* Hero metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <IvyStatCard
          label="Total Expenses"
          value={formatEGP(hero.total)}
          sublabel="across all pools & sources"
          icon={<path d="M9 14l6-6m-5.5.5h.01m4.99 4.99h.01M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/>}
        />
        <IvyStatCard
          label="Top Category"
          value={hero.topCategory ? EXPENSE_CATEGORY_LABEL[hero.topCategory] : '—'}
          sublabel={hero.topCategory ? `${formatEGP(hero.topAmount)} · ${hero.topPct}% of spend` : 'no expenses yet'}
          icon={<path d="M9 17v-2m3 2v-4m3 4v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/>}
        />
        <IvyStatCard
          label="Transactions"
          value={String(hero.count)}
          sublabel={`avg ${formatEGP(hero.avg)} each`}
          icon={<path d="M4 7h16M4 12h16M4 17h10"/>}
        />
      </div>

      {/* Breakdown + list, side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-4 items-start">
        {/* Breakdown by category — bars scaled to the largest category */}
        <SectionCard
          title="By Category"
          subtitle={sourceFilter !== 'all' ? `via ${EXPENSE_SOURCE_LABEL[sourceFilter].toLowerCase()}` : 'share of total spend'}
        >
          {breakdown.length === 0 ? (
            <EmptyState text="no expenses match this source" />
          ) : (
            <div className="flex flex-col gap-[0.6rem]">
              {breakdown.map((b) => {
                const active = categoryFilter === b.category;
                return (
                  <button
                    key={b.category}
                    onClick={() => setCategoryFilter(active ? 'all' : b.category)}
                    className={`text-left rounded-[8px] px-2 py-[6px] -mx-2 transition-colors duration-150 ${
                      active ? 'bg-background3' : 'hover:bg-background3/60'
                    }`}
                    title={active ? 'Clear category filter' : `Filter list to ${EXPENSE_CATEGORY_LABEL[b.category]}`}
                  >
                    <div className="flex items-center justify-between mb-[5px] gap-2">
                      <span className={`text-[0.7rem] truncate ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {EXPENSE_CATEGORY_LABEL[b.category]}
                      </span>
                      <span className="text-[0.7rem] text-text-primary tabular-nums shrink-0">{formatEGP(b.total)}</span>
                    </div>
                    <ProgressBar pct={breakdownMax > 0 ? (b.total / breakdownMax) * 100 : 0} />
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Expense list with inline filters */}
        <div className="bg-background border border-border rounded-[12px] flex flex-col overflow-hidden">
          <div className="px-[1.2rem] pt-[1.2rem] pb-3 border-b border-border">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary">Expenses</div>
              <span className="text-[0.66rem] text-text-tertiary tabular-nums">
                {filtered.length} · {formatEGP(filteredTotal)}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                aria-label="Filter by category"
                className="bg-background2 border border-border rounded-[8px] px-3 py-[6px] text-[0.7rem] text-text-secondary hover:border-border-md focus:border-border-hover focus:outline-none transition-colors duration-150"
              >
                <option value="all">All categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c]}</option>
                ))}
              </select>

              <div className="inline-flex rounded-[9px] border border-border p-[3px] bg-background2" role="radiogroup" aria-label="Filter by source">
                {(['all', ...EXPENSE_SOURCES] as SourceFilter[]).map((s) => {
                  const active = sourceFilter === s;
                  return (
                    <button
                      key={s}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSourceFilter(s)}
                      className={`flex items-center gap-[5px] px-[10px] py-[5px] rounded-[6px] text-[0.68rem] transition-colors duration-150 ${
                        active ? 'bg-background text-text-primary border border-border-md' : 'text-text-tertiary hover:text-text-secondary'
                      }`}
                      title={s === 'all' ? 'All sources' : EXPENSE_SOURCE_LABEL[s]}
                    >
                      {s === 'all' ? 'All' : <SourceIcon source={s} className="w-[12px] h-[12px]" />}
                    </button>
                  );
                })}
              </div>

              {(categoryFilter !== 'all' || sourceFilter !== 'all') && (
                <button
                  onClick={() => { setCategoryFilter('all'); setSourceFilter('all'); }}
                  className="text-[0.66rem] text-text-tertiary hover:text-text-primary transition-colors duration-150"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="p-[0.7rem] max-h-[520px] overflow-y-auto scrollbar-hide">
            {filtered.length === 0 ? (
              <EmptyState text="no expenses match these filters" />
            ) : (
              <div className="flex flex-col gap-[6px]">
                {filtered.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 bg-background2 border border-border rounded-[10px] px-3 py-[0.7rem] hover:border-border-md transition-colors duration-150"
                  >
                    <span
                      className="w-[28px] h-[28px] shrink-0 rounded-[8px] bg-background border border-border flex items-center justify-center text-text-secondary"
                      title={`Logged via ${EXPENSE_SOURCE_LABEL[e.source].toLowerCase()}`}
                    >
                      <SourceIcon source={e.source} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.74rem] text-text-primary truncate">{e.note}</div>
                      <div className="flex items-center gap-2 mt-[3px]">
                        <span className="text-[0.58rem] px-[7px] py-[1px] rounded-full bg-background border border-border text-text-tertiary">
                          {EXPENSE_CATEGORY_LABEL[e.category]}
                        </span>
                        <span className="text-[0.61rem] text-text-tertiary">{formatDay(e.spent_at)}</span>
                      </div>
                    </div>
                    <div className="text-[0.78rem] text-text-primary tabular-nums shrink-0">−{formatEGP(e.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <AddExpenseDrawer capitals={state.capitals} onClose={() => setDrawerOpen(false)} />
      )}
    </IvyShell>
  );
}
