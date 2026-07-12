'use client';

import { useMemo, useState } from 'react';
import ProductThumb from './ProductThumb';
import { EmptyState, formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';
import { Product } from '@/lib/ivy/types';

// Zone C — the full product/variant table. Search, filter chips, sortable
// columns, inline-editable unit cost, and a focused "fill costs" bulk mode so a
// founder with 50 SKUs can cost everything in one pass.

export type InventoryFilter = 'all' | 'missing' | 'best' | 'low' | 'dead';
type SortKey = 'product' | 'units' | 'velocity' | 'days' | 'cost' | 'value';

const LOW_STOCK_DAYS = 7;

const isLow = (p: Product) => p.daysOfStock != null && p.daysOfStock <= LOW_STOCK_DAYS;
const isDead = (p: Product) => p.velocity30d === 0;
const stockValue = (p: Product) => (p.unitCost != null ? p.unitsInStock * p.unitCost : null);

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

// ── Inline cost cell ───────────────────────────────────────────────────────────
function CostCell({ product, bulk }: { product: Product; bulk: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(product.unitCost != null ? String(product.unitCost) : '');
  const open = editing || bulk;

  const commit = () => {
    const n = Number(value);
    if (value.trim() !== '' && Number.isFinite(n) && n > 0) {
      ivyClient.setProductCost(product.variantId, Math.round(n));
    }
    setEditing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
      if (bulk) {
        // Tab-style hop to the next unfilled cost input in the focused pass.
        const table = e.currentTarget.closest('table');
        const inputs = Array.from(table?.querySelectorAll<HTMLInputElement>('input[data-bulk="1"]') ?? []);
        const i = inputs.indexOf(e.currentTarget);
        inputs[i + 1]?.focus();
      }
    } else if (e.key === 'Escape' && !bulk) {
      setValue(product.unitCost != null ? String(product.unitCost) : '');
      setEditing(false);
    }
  };

  if (open) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-[0.62rem] text-text-tertiary">EGP</span>
        <input
          data-bulk={bulk ? '1' : undefined}
          type="number"
          min="0"
          inputMode="numeric"
          autoFocus={editing}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          placeholder="0"
          className="w-[76px] bg-input-bg border border-ivy-accent-border rounded-[6px] px-2 py-[3px] text-[0.72rem] text-text-primary tabular-nums focus:outline-none focus:border-ivy-accent"
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
    <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 group" title="Edit cost">
      <span className="text-[0.74rem] text-text-primary tabular-nums group-hover:text-ivy-accent transition-colors duration-150">
        {formatEGP(product.unitCost)}
      </span>
      <span className="text-[0.5rem] uppercase tracking-[0.06em] text-text-tertiary border border-border rounded px-[4px] py-[1px]">
        {product.costSource ?? 'manual'}
      </span>
    </button>
  );
}

// ── Sortable header cell ───────────────────────────────────────────────────────
function Th({
  label,
  sortKey,
  sort,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: 'asc' | 'desc' };
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sort.key === sortKey;
  return (
    <th className={`font-normal ${align === 'right' ? 'text-right' : 'text-left'} px-3 py-2`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.08em] transition-colors duration-150 ${
          active ? 'text-text-secondary' : 'text-text-tertiary hover:text-text-secondary'
        } ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        <svg
          className={`w-[9px] h-[9px] transition-all duration-150 ${active ? 'opacity-100' : 'opacity-0'} ${
            active && sort.dir === 'asc' ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </th>
  );
}

export default function ProductTable({
  filter,
  onFilter,
}: {
  filter: InventoryFilter;
  onFilter: (f: InventoryFilter) => void;
}) {
  const state = useIvy();
  const products = state.products;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'days', dir: 'asc' });
  const [bulk, setBulk] = useState(false);
  const [bulkTargets, setBulkTargets] = useState<string[]>([]);

  const counts = useMemo(() => ({
    all: products.length,
    missing: products.filter((p) => p.unitCost == null).length,
    best: products.filter((p) => p.isBestSeller).length,
    low: products.filter(isLow).length,
    dead: products.filter(isDead).length,
  }), [products]);

  const bulkDone = useMemo(
    () => bulkTargets.filter((id) => products.find((p) => p.variantId === id)?.unitCost != null).length,
    [bulkTargets, products],
  );

  const rows = useMemo(() => {
    let list = products;
    if (bulk) {
      list = list.filter((p) => bulkTargets.includes(p.variantId));
    } else {
      if (filter !== 'all') list = list.filter((p) => matchesFilter(p, filter));
      const q = search.trim().toLowerCase();
      if (q) list = list.filter((p) => `${p.productTitle} ${p.variantTitle}`.toLowerCase().includes(q));
    }
    const dir = sort.dir === 'asc' ? 1 : -1;
    const val = (p: Product): number | string => {
      switch (sort.key) {
        case 'product': return `${p.productTitle} ${p.variantTitle}`.toLowerCase();
        case 'units': return p.unitsInStock;
        case 'velocity': return p.velocity30d;
        case 'days': return p.daysOfStock ?? Number.POSITIVE_INFINITY;
        case 'cost': return p.unitCost ?? -1;
        case 'value': return stockValue(p) ?? -1;
      }
    };
    return [...list].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [products, bulk, bulkTargets, filter, search, sort]);

  const onSort = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }));

  const startBulk = () => {
    setBulkTargets(products.filter((p) => p.unitCost == null).map((p) => p.variantId));
    setBulk(true);
  };

  const endBulk = () => {
    setBulk(false);
    onFilter('all');
  };

  return (
    <div className="bg-background border border-border rounded-[16px] overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border flex-wrap">
        {bulk ? (
          <>
            <div className="flex items-center gap-3">
              <span className="text-[0.72rem] text-text-primary font-medium">Filling costs</span>
              <span className="text-[0.66rem] text-text-tertiary tabular-nums">
                {bulkDone} of {bulkTargets.length} done
              </span>
              <div className="h-[4px] w-[120px] rounded-full bg-background4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-ivy-accent transition-[width] duration-300"
                  style={{ width: `${bulkTargets.length ? (bulkDone / bulkTargets.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <button
              onClick={endBulk}
              className="rounded-[8px] bg-btn-bg text-btn-text px-4 py-[6px] text-[0.7rem] font-medium hover:opacity-90 transition-opacity duration-150"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <div className="relative">
              <svg className="absolute left-[10px] top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
                className="bg-input-bg border border-border rounded-[8px] pl-[30px] pr-3 py-[6px] text-[0.72rem] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors duration-150 w-[190px]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-[3px] rounded-[9px] border border-border p-[3px] bg-background flex-wrap">
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => onFilter(f.key)}
                      className={`px-[10px] py-[4px] rounded-[6px] text-[0.66rem] transition-colors duration-150 ${
                        active ? 'bg-background2 text-text-primary border border-border-md' : 'text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      {f.label}
                      <span className="ml-1 tabular-nums opacity-60">{counts[f.key]}</span>
                    </button>
                  );
                })}
              </div>
              {counts.missing > 0 && (
                <button
                  onClick={startBulk}
                  className="rounded-[8px] border border-ivy-accent-border text-ivy-accent px-3 py-[6px] text-[0.7rem] font-medium hover:bg-ivy-accent/10 transition-colors duration-150"
                >
                  Fill costs
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState text="no products match" />
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <Th label="Product" sortKey="product" sort={sort} onSort={onSort} />
                <Th label="In stock" sortKey="units" sort={sort} onSort={onSort} align="right" />
                <Th label="Velocity" sortKey="velocity" sort={sort} onSort={onSort} align="right" />
                <Th label="Days of stock" sortKey="days" sort={sort} onSort={onSort} align="right" />
                <Th label="Unit cost" sortKey="cost" sort={sort} onSort={onSort} />
                <Th label="Stock value" sortKey="value" sort={sort} onSort={onSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const daysRed = p.daysOfStock != null && p.daysOfStock < LOW_STOCK_DAYS && p.isBestSeller;
                const sv = stockValue(p);
                return (
                  <tr key={p.variantId} className="border-b border-border last:border-b-0 hover:bg-background2/60 transition-colors duration-150">
                    {/* Product */}
                    <td className="px-3 py-[10px]">
                      <div className="flex items-center gap-[10px]">
                        {p.isBestSeller && <span className="w-[5px] h-[5px] rounded-full bg-ivy-accent shrink-0" title="Best seller" />}
                        <ProductThumb title={p.productTitle} imageUrl={p.imageUrl} />
                        <div className="min-w-0">
                          <div className="text-[0.74rem] text-text-primary truncate">{p.productTitle}</div>
                          <div className="text-[0.64rem] text-text-tertiary truncate">{p.variantTitle}</div>
                        </div>
                      </div>
                    </td>
                    {/* In stock */}
                    <td className="px-3 py-[10px] text-right text-[0.74rem] text-text-primary tabular-nums">
                      {p.unitsInStock.toLocaleString('en-US')}
                    </td>
                    {/* Velocity */}
                    <td className="px-3 py-[10px] text-right tabular-nums">
                      {p.velocity30d > 0 ? (
                        <span className="text-[0.74rem] text-text-secondary">{p.velocity30d.toFixed(1)}<span className="text-text-tertiary text-[0.6rem]">/day</span></span>
                      ) : (
                        <span className="text-[0.68rem] text-text-tertiary">no sales</span>
                      )}
                    </td>
                    {/* Days of stock */}
                    <td className="px-3 py-[10px] text-right tabular-nums">
                      <span className={`text-[0.74rem] ${daysRed ? 'text-[#e07070]' : 'text-text-secondary'}`}>
                        {p.daysOfStock == null ? '∞' : `${p.daysOfStock}d`}
                      </span>
                    </td>
                    {/* Unit cost */}
                    <td className="px-3 py-[10px]">
                      <CostCell product={p} bulk={bulk} />
                    </td>
                    {/* Stock value */}
                    <td className="px-3 py-[10px] text-right text-[0.74rem] tabular-nums">
                      {sv == null ? <span className="text-text-tertiary">—</span> : <span className="text-text-primary">{formatEGP(sv)}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
