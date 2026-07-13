'use client';

import { Fragment, useMemo, useState } from 'react';
import ProductThumb from './ProductThumb';
import { EmptyState, formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';
import { Product } from '@/lib/ivy/types';

// Zone C — products with expandable variants. One row per product (aggregated
// stock, velocity, soonest days-of-stock, cost coverage, total value); expand to
// reveal the per-variant rows with inline-editable unit cost. The product row's
// "add cost" applies one price to every variant at once (the common case);
// variants priced differently are filled individually after expanding, and the
// product row then shows the summed variant costs.

export type InventoryFilter = 'all' | 'missing' | 'best' | 'low' | 'dead';
type SortKey = 'product' | 'units' | 'velocity' | 'days' | 'cost' | 'value';

const LOW_STOCK_DAYS = 7;

const isLow = (p: Product) => p.daysOfStock != null && p.daysOfStock <= LOW_STOCK_DAYS;
const isDead = (p: Product) => p.velocity30d === 0;
const variantValue = (p: Product) => (p.unitCost != null ? p.unitsInStock * p.unitCost : null);
const fmtDays = (d: number | null) => (d == null ? '∞' : `${d}d`);

const FILTERS: { key: InventoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'missing', label: 'Missing cost' },
  { key: 'best', label: 'Best sellers' },
  { key: 'low', label: 'Low stock' },
  { key: 'dead', label: 'Dead stock' },
];

function matchesFilter(p: Product, f: InventoryFilter): boolean {
  switch (f) {
    case 'missing': return p.unitCost == null;
    case 'best': return p.isBestSeller;
    case 'low': return isLow(p);
    case 'dead': return isDead(p);
    default: return true;
  }
}

// ── Aggregated product group ────────────────────────────────────────────────────
interface Group {
  title: string;
  variants: Product[];
  units: number;
  velocity: number;
  /** Soonest stock-out across variants — the triage signal. */
  daysOfStock: number | null;
  /** Σ variant stock value (null if no variant has a cost). */
  stockValue: number | null;
  costed: number;
  total: number;
  isBestSeller: boolean;
  /** A best-seller variant is about to sell out — surfaces red. */
  urgent: boolean;
}

function groupOf(title: string, variants: Product[]): Group {
  let units = 0;
  let velocity = 0;
  let stockValue = 0;
  let costed = 0;
  let anyCost = false;
  const dayVals: number[] = [];
  let urgent = false;
  for (const v of variants) {
    units += v.unitsInStock;
    velocity += v.velocity30d;
    if (v.unitCost != null) { stockValue += v.unitsInStock * v.unitCost; costed += 1; anyCost = true; }
    if (v.daysOfStock != null) dayVals.push(v.daysOfStock);
    if (v.isBestSeller && v.daysOfStock != null && v.daysOfStock < LOW_STOCK_DAYS) urgent = true;
  }
  return {
    title,
    variants,
    units,
    velocity,
    daysOfStock: dayVals.length ? Math.min(...dayVals) : null,
    stockValue: anyCost ? stockValue : null,
    costed,
    total: variants.length,
    isBestSeller: variants.some((v) => v.isBestSeller),
    urgent,
  };
}

// ── Inline cost cell ───────────────────────────────────────────────────────────
function CostCell({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(product.unitCost != null ? String(product.unitCost) : '');

  const commit = () => {
    const n = Number(value);
    if (value.trim() !== '' && Number.isFinite(n) && n > 0) ivyClient.setProductCost(product.variantId, Math.round(n));
    setEditing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      setValue(product.unitCost != null ? String(product.unitCost) : '');
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-[0.6rem] text-text-tertiary">EGP</span>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          placeholder="0"
          className="w-[74px] bg-input-bg border border-ivy-accent-border rounded-[6px] px-2 py-[3px] text-[0.72rem] text-text-primary tabular-nums text-right focus:outline-none focus:border-ivy-accent"
        />
      </span>
    );
  }

  if (product.unitCost == null) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-ivy-accent-border text-ivy-accent px-[10px] py-[3px] text-[0.62rem] hover:bg-ivy-accent/10 transition-colors duration-150"
      >
        <svg className="w-[9px] h-[9px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        add cost
      </button>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 group/cost" title="Edit cost">
      <span className="text-[0.74rem] text-text-primary tabular-nums group-hover/cost:text-ivy-accent transition-colors duration-150">
        {formatEGP(product.unitCost)}
      </span>
      <span className="text-[0.48rem] uppercase tracking-[0.07em] text-text-tertiary border border-border rounded px-[4px] py-[1px]">
        {product.costSource ?? 'manual'}
      </span>
    </button>
  );
}

/** Product-row cost cell for multi-variant products.
    - no variant costed → "add cost" applies ONE price to every variant, no
      expanding needed (the common case: all variants share a cost)
    - some costed → progress hint; expand the row to fill the rest per variant
    - all costed, same price → that price, editable (re-applies to all)
    - all costed, different prices → the summed variant costs (Σ tag) */
function GroupCostCell({ group }: { group: Group }) {
  const { variants, costed, total } = group;
  const shared =
    costed === total && variants.every((v) => v.unitCost === variants[0].unitCost)
      ? variants[0].unitCost
      : null;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const startEdit = () => {
    setValue(shared != null ? String(shared) : '');
    setEditing(true);
  };

  const commit = () => {
    const n = Number(value);
    if (value.trim() !== '' && Number.isFinite(n) && n > 0) {
      const cost = Math.round(n);
      variants.forEach((v) => ivyClient.setProductCost(v.variantId, cost));
    }
    setEditing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1" title={`Applies to all ${total} variants`}>
        <span className="text-[0.6rem] text-text-tertiary">EGP</span>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          placeholder="0"
          className="w-[74px] bg-input-bg border border-ivy-accent-border rounded-[6px] px-2 py-[3px] text-[0.72rem] text-text-primary tabular-nums text-right focus:outline-none focus:border-ivy-accent"
        />
      </span>
    );
  }

  if (costed === 0) {
    return (
      <button
        onClick={startEdit}
        title={`One price applied to all ${total} variants — expand the row to price them individually`}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-ivy-accent-border text-ivy-accent px-[10px] py-[3px] text-[0.62rem] hover:bg-ivy-accent/10 transition-colors duration-150"
      >
        <svg className="w-[9px] h-[9px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        add cost · all {total}
      </button>
    );
  }

  if (costed < total) {
    return (
      <span className="inline-flex items-center gap-1 text-[0.64rem] text-ivy-accent">
        <span className="w-[5px] h-[5px] rounded-full bg-ivy-accent" />
        {costed}/{total} costed
      </span>
    );
  }

  if (shared != null) {
    return (
      <button onClick={startEdit} className="inline-flex items-center gap-2 group/cost" title="Edit cost for all variants">
        <span className="text-[0.74rem] text-text-primary tabular-nums group-hover/cost:text-ivy-accent transition-colors duration-150">
          {formatEGP(shared)}
        </span>
        <span className="text-[0.48rem] uppercase tracking-[0.07em] text-text-tertiary border border-border rounded px-[4px] py-[1px]">
          all {total}
        </span>
      </button>
    );
  }

  const sum = variants.reduce((s, v) => s + (v.unitCost ?? 0), 0);
  return (
    <span className="inline-flex items-center gap-2" title="Variants are priced individually — expand to edit">
      <span className="text-[0.74rem] text-text-primary tabular-nums">{formatEGP(sum)}</span>
      <span className="text-[0.48rem] uppercase tracking-[0.07em] text-text-tertiary border border-border rounded px-[4px] py-[1px]">
        Σ {total}
      </span>
    </span>
  );
}

// ── Sortable header cell ───────────────────────────────────────────────────────
function Th({
  label, sortKey, sort, onSort, align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: 'asc' | 'desc' };
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sort.key === sortKey;
  return (
    <th className={`font-normal ${align === 'right' ? 'text-right' : 'text-left'} px-4 py-[10px]`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 text-[0.56rem] uppercase tracking-[0.09em] transition-colors duration-150 ${
          active ? 'text-text-secondary' : 'text-text-tertiary hover:text-text-secondary'
        } ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        <svg
          className={`w-[9px] h-[9px] transition-all duration-150 ${active ? 'opacity-100' : 'opacity-0'} ${active && sort.dir === 'asc' ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </th>
  );
}

const BestDot = () => <span className="w-[5px] h-[5px] rounded-full bg-ivy-accent shrink-0" title="Best seller" />;

export default function ProductTable({
  filter, onFilter,
}: {
  filter: InventoryFilter;
  onFilter: (f: InventoryFilter) => void;
}) {
  const state = useIvy();
  const products = state.products;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'days', dir: 'asc' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const counts = useMemo(() => ({
    all: products.length,
    missing: products.filter((p) => p.unitCost == null).length,
    best: products.filter((p) => p.isBestSeller).length,
    low: products.filter(isLow).length,
    dead: products.filter(isDead).length,
  }), [products]);

  const q = search.trim().toLowerCase();
  const filterActive = filter !== 'all' || q !== '';

  const groups = useMemo(() => {
    const matched = products.filter((p) => {
      if (filter !== 'all' && !matchesFilter(p, filter)) return false;
      if (q && !`${p.productTitle} ${p.variantTitle}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const byTitle = new Map<string, Product[]>();
    for (const p of matched) {
      const arr = byTitle.get(p.productTitle) ?? [];
      arr.push(p);
      byTitle.set(p.productTitle, arr);
    }
    const list = Array.from(byTitle.entries()).map(([title, vs]) => groupOf(title, vs));

    const dir = sort.dir === 'asc' ? 1 : -1;
    const val = (g: Group): number | string => {
      switch (sort.key) {
        case 'product': return g.title.toLowerCase();
        case 'units': return g.units;
        case 'velocity': return g.velocity;
        case 'days': return g.daysOfStock ?? Number.POSITIVE_INFINITY;
        case 'cost': return g.total ? g.costed / g.total : -1;
        case 'value': return g.stockValue ?? -1;
      }
    };
    return list.sort((a, b) => {
      const av = val(a); const bv = val(b);
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [products, filter, q, sort]);

  const onSort = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }));
  const isOpen = (title: string) => filterActive || expanded.has(title);
  const toggle = (title: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  const COLS = (
    <colgroup>
      <col />
      <col style={{ width: 96 }} />
      <col style={{ width: 104 }} />
      <col style={{ width: 118 }} />
      <col style={{ width: 168 }} />
      <col style={{ width: 132 }} />
    </colgroup>
  );

  return (
    <div className="bg-background border border-border rounded-[16px] overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border flex-wrap bg-background2/30">
        <div className="relative">
          <svg className="absolute left-[10px] top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="bg-input-bg border border-border rounded-[8px] pl-[30px] pr-3 py-[6px] text-[0.72rem] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors duration-150 w-[200px]"
          />
        </div>
        <div className="flex items-center gap-[3px] rounded-[9px] border border-border p-[3px] bg-background flex-wrap">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => onFilter(f.key)}
                className={`px-[10px] py-[4px] rounded-[6px] text-[0.66rem] transition-colors duration-150 ${active ? 'bg-background2 text-text-primary border border-border-md' : 'text-text-tertiary hover:text-text-secondary'}`}
              >
                {f.label}<span className="ml-1 tabular-nums opacity-60">{counts[f.key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState text="no products match" />
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[760px] border-collapse">
            {COLS}
            <thead>
              <tr className="border-b border-border bg-background2/40">
                <Th label="Product" sortKey="product" sort={sort} onSort={onSort} />
                <Th label="In stock" sortKey="units" sort={sort} onSort={onSort} align="right" />
                <Th label="Velocity" sortKey="velocity" sort={sort} onSort={onSort} align="right" />
                <Th label="Days left" sortKey="days" sort={sort} onSort={onSort} align="right" />
                <Th label="Unit cost" sortKey="cost" sort={sort} onSort={onSort} />
                <Th label="Stock value" sortKey="value" sort={sort} onSort={onSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const open = isOpen(g.title);
                const single = g.total === 1;
                const groupDaysRed = g.daysOfStock != null && g.daysOfStock < LOW_STOCK_DAYS && g.isBestSeller;
                return (
                  <Fragment key={g.title}>
                    {/* Product row */}
                    <tr
                      onClick={() => !single && toggle(g.title)}
                      className={`border-b border-border transition-colors duration-150 ${single ? '' : 'cursor-pointer'} ${open && !single ? 'bg-background2/40' : 'hover:bg-background2/30'}`}
                    >
                      <td className="px-4 py-[13px]">
                        <div className="flex items-center gap-[10px]">
                          <span className="w-[14px] shrink-0 text-text-tertiary">
                            {!single && (
                              <svg className={`w-[12px] h-[12px] transition-transform duration-200 ${open ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                            )}
                          </span>
                          {g.isBestSeller && <BestDot />}
                          <ProductThumb title={g.title} imageUrl={g.variants[0]?.imageUrl ?? null} size={36} />
                          <div className="min-w-0">
                            <div className="text-[0.8rem] font-medium text-text-primary truncate">{g.title}</div>
                            <div className="text-[0.62rem] text-text-tertiary">
                              {single ? g.variants[0].variantTitle : `${g.total} variants`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-[13px] text-right text-[0.78rem] text-text-primary tabular-nums">{g.units.toLocaleString('en-US')}</td>
                      <td className="px-4 py-[13px] text-right tabular-nums">
                        {g.velocity > 0 ? (
                          <span className="text-[0.76rem] text-text-secondary">{g.velocity.toFixed(1)}<span className="text-text-tertiary text-[0.58rem]">/day</span></span>
                        ) : (
                          <span className="text-[0.66rem] text-text-tertiary">no sales</span>
                        )}
                      </td>
                      <td className="px-4 py-[13px] text-right">
                        {groupDaysRed ? (
                          <span className="inline-block rounded-full bg-[#e07070]/12 text-[#e07070] px-[8px] py-[2px] text-[0.68rem] tabular-nums">{fmtDays(g.daysOfStock)}</span>
                        ) : (
                          <span className="text-[0.76rem] text-text-secondary tabular-nums">{fmtDays(g.daysOfStock)}</span>
                        )}
                      </td>
                      {/* stopPropagation: the row click toggles expansion */}
                      <td className="px-4 py-[13px]" onClick={(e) => e.stopPropagation()}>
                        {single ? <CostCell product={g.variants[0]} /> : <GroupCostCell group={g} />}
                      </td>
                      <td className="px-4 py-[13px] text-right text-[0.78rem] tabular-nums">
                        {g.stockValue == null ? <span className="text-text-tertiary">—</span> : <span className="text-text-primary">{formatEGP(g.stockValue)}</span>}
                      </td>
                    </tr>

                    {/* Variant rows */}
                    {!single && open && g.variants.map((v) => {
                      const vRed = v.daysOfStock != null && v.daysOfStock < LOW_STOCK_DAYS && v.isBestSeller;
                      const sv = variantValue(v);
                      return (
                        <tr key={v.variantId} className="border-b border-border last:border-b-0 bg-background2/15 hover:bg-background2/30 transition-colors duration-150">
                          <td className="py-[9px] pr-4 pl-4">
                            <div className="flex items-center gap-[10px] pl-[24px] relative">
                              <span className="absolute left-[6px] top-1/2 -translate-y-1/2 w-[9px] h-px bg-border" aria-hidden="true" />
                              {v.isBestSeller ? <BestDot /> : <span className="w-[5px] shrink-0" />}
                              <span className="text-[0.73rem] text-text-secondary truncate">{v.variantTitle}</span>
                            </div>
                          </td>
                          <td className="px-4 py-[9px] text-right text-[0.73rem] text-text-secondary tabular-nums">{v.unitsInStock.toLocaleString('en-US')}</td>
                          <td className="px-4 py-[9px] text-right tabular-nums">
                            {v.velocity30d > 0 ? (
                              <span className="text-[0.72rem] text-text-tertiary">{v.velocity30d.toFixed(1)}<span className="text-[0.56rem]">/day</span></span>
                            ) : (
                              <span className="text-[0.64rem] text-text-tertiary">no sales</span>
                            )}
                          </td>
                          <td className="px-4 py-[9px] text-right">
                            <span className={`text-[0.72rem] tabular-nums ${vRed ? 'text-[#e07070]' : 'text-text-tertiary'}`}>{fmtDays(v.daysOfStock)}</span>
                          </td>
                          <td className="px-4 py-[9px]"><CostCell product={v} /></td>
                          <td className="px-4 py-[9px] text-right text-[0.73rem] tabular-nums">
                            {sv == null ? <span className="text-text-tertiary">—</span> : <span className="text-text-secondary">{formatEGP(sv)}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
