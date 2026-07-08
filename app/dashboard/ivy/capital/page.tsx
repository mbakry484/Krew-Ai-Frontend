'use client';

import { useEffect, useMemo, useState } from 'react';
import IvyShell from '../components/IvyShell';
import { ProgressBar, SourceIcon } from '../components/_ivyShared';
import { CARD_THEME } from '../components/cardThemes';
import CapitalCard, { cardDigits } from '../components/CapitalCard';
import DashboardModal from '@/components/DashboardModal';
import { EmptyState, formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient, selectExpensesForCapital } from '@/lib/ivy/ivyClient';
import {
  Capital,
  CAPITAL_COLORS,
  CapitalColor,
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_SOURCE_LABEL,
  ExpenseCategory,
} from '@/lib/ivy/types';

const inputCls =
  'w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.78rem] text-text-primary placeholder:text-text-tertiary focus:border-border-hover focus:outline-none transition-colors duration-150';
const labelCls = 'text-[0.62rem] uppercase tracking-[0.08em] text-text-tertiary mb-[6px] block';

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

/** Card + control row + collapsible deductions accordion. */
function PoolUnit({
  pool,
  index,
  minted,
  onEdit,
}: {
  pool: Capital;
  index: number;
  /** Freshly created this session — plays the Mint animation. */
  minted: boolean;
  onEdit: () => void;
}) {
  const state = useIvy();
  const deductions = useMemo(() => selectExpensesForCapital(state, pool.id), [state, pool.id]);
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const spentTotal = deductions.reduce((s, e) => s + e.amount, 0);
  const hasDeductions = deductions.length > 0;

  const grouped = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of deductions) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [deductions]);
  const groupedMax = grouped.reduce((m, g) => Math.max(m, g.total), 0);

  return (
    <div className="cap-unit" data-minted={minted} style={{ animationDelay: minted ? '0ms' : `${index * 70}ms` }}>
      <CapitalCard
        name={pool.name}
        injected={pool.initial_amount}
        balance={pool.current_balance}
        color={pool.color}
        digits={cardDigits(pool.id)}
        expanded={open}
        onClick={() => setOpen((o) => !o)}
      />

      {/* Control row */}
      <div className="flex items-center justify-between gap-2 mt-3 px-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-[0.7rem] text-text-secondary hover:text-text-primary transition-colors duration-150"
          aria-expanded={open}
        >
          <svg
            className={`w-[12px] h-[12px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          {hasDeductions ? `${deductions.length} deduction${deductions.length !== 1 ? 's' : ''} · ${formatEGP(spentTotal)}` : 'No deductions yet'}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            aria-label={`Edit ${pool.name}`}
            title="Edit pool"
            className="w-[28px] h-[28px] rounded-[8px] border border-border flex items-center justify-center text-text-tertiary hover:border-border-md hover:text-text-primary transition-all duration-150"
          >
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => !hasDeductions && setConfirmingDelete(true)}
            disabled={hasDeductions}
            aria-label={`Delete ${pool.name}`}
            title={hasDeductions ? "Pools with logged expenses can't be deleted" : 'Delete pool'}
            className="w-[28px] h-[28px] rounded-[8px] border border-border flex items-center justify-center text-text-tertiary hover:border-[#e07070]/50 hover:text-[#e07070] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-text-tertiary"
          >
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
              <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Inline delete confirm */}
      {confirmingDelete && (
        <div className="flex items-center justify-between gap-3 bg-[#e07070]/10 border border-[#e07070]/30 rounded-[10px] px-4 py-3 mt-3">
          <span className="text-[0.7rem] text-text-secondary">Delete <span className="text-text-primary">{pool.name}</span>?</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-[8px] border border-border px-3 py-[5px] text-[0.68rem] text-text-secondary hover:border-border-md hover:text-text-primary transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={() => ivyClient.deleteCapital(pool.id)}
              className="rounded-[8px] bg-[#e07070] text-white px-3 py-[5px] text-[0.68rem] font-medium hover:opacity-90 transition-opacity duration-150"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Deductions accordion */}
      <div className="cap-panel" data-open={open}>
        <div className="cap-panel-inner">
          <div className="mt-3 bg-background border border-border rounded-[12px] p-4">
            {!hasDeductions ? (
              <EmptyState text="nothing deducted from this pool yet" />
            ) : (
              <>
                {/* Category mini-breakdown */}
                <div className="flex flex-col gap-[0.6rem] mb-4">
                  {grouped.map((g) => (
                    <div key={g.category}>
                      <div className="flex items-center justify-between mb-[4px] gap-2">
                        <span className="text-[0.68rem] text-text-secondary truncate">{EXPENSE_CATEGORY_LABEL[g.category]}</span>
                        <span className="text-[0.68rem] text-text-primary tabular-nums shrink-0">{formatEGP(g.total)}</span>
                      </div>
                      <ProgressBar pct={groupedMax > 0 ? (g.total / groupedMax) * 100 : 0} />
                    </div>
                  ))}
                </div>

                {/* Individual deductions */}
                <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary mb-2">all deductions</div>
                <div className="flex flex-col gap-[5px] max-h-[240px] overflow-y-auto scrollbar-hide">
                  {deductions.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 bg-background2 border border-border rounded-[8px] px-3 py-[0.55rem]">
                      <span className="text-text-tertiary shrink-0" title={`Logged via ${EXPENSE_SOURCE_LABEL[e.source].toLowerCase()}`}>
                        <SourceIcon source={e.source} className="w-[11px] h-[11px]" />
                      </span>
                      <span className="flex-1 min-w-0 text-[0.68rem] text-text-secondary truncate">{e.note}</span>
                      <span className="text-[0.6rem] text-text-tertiary shrink-0">{formatDay(e.spent_at)}</span>
                      <span className="text-[0.68rem] text-text-primary tabular-nums shrink-0">−{formatEGP(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Add / edit pool — live card preview + color picker. */
function PoolModal({
  pool,
  onClose,
  onCreated,
}: {
  pool?: Capital;
  onClose: () => void;
  /** Fired with the new row so the grid can play the Mint on it. */
  onCreated?: (row: Capital) => void;
}) {
  const editing = !!pool;
  const [name, setName] = useState(pool?.name ?? '');
  const [amount, setAmount] = useState(pool ? String(pool.initial_amount) : '');
  const [color, setColor] = useState<CapitalColor>(pool?.color ?? 'teal');
  const [error, setError] = useState('');

  const spent = pool ? pool.initial_amount - pool.current_balance : 0;
  const numericAmount = Number(amount) || 0;
  const previewBalance = editing ? numericAmount - spent : numericAmount;

  const submit = () => {
    const value = Number(amount);
    if (!name.trim()) { setError('Give the pool a name.'); return; }
    if (!Number.isFinite(value) || value <= 0) { setError('Enter an injected amount greater than zero.'); return; }
    if (editing && value < spent) { setError(`Injected can't be below what's already spent (${formatEGP(spent)}).`); return; }
    if (editing) {
      ivyClient.updateCapital(pool!.id, { name: name.trim(), initial_amount: value, color });
    } else {
      const row = ivyClient.addCapital({ name: name.trim(), initial_amount: value, color });
      onCreated?.(row);
    }
    onClose();
  };

  return (
    <DashboardModal onClose={onClose} labelledBy="pool-modal-title" variant="center">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
        <div>
          <div id="pool-modal-title" className="text-[0.82rem] font-medium text-text-primary">
            {editing ? 'Edit capital pool' : 'New capital pool'}
          </div>
          <div className="text-[0.64rem] text-text-tertiary mt-[2px]">
            {editing ? 'rename, recolor, or adjust the injected amount' : 'design a card so this pool is easy to spot'}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5 overflow-y-auto">
        {/* Live preview */}
        <div className="cap-preview">
          <CapitalCard
            name={name}
            injected={numericAmount}
            balance={previewBalance}
            color={color}
            digits={pool ? cardDigits(pool.id) : '0000'}
          />
        </div>

        {/* Color picker */}
        <div>
          <span className={labelCls}>Card color</span>
          <div className="flex items-center gap-[10px] flex-wrap">
            {CAPITAL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={CARD_THEME[c].label}
                aria-pressed={color === c}
                title={CARD_THEME[c].label}
                className="cap-swatch"
                data-active={color === c}
                style={{ background: CARD_THEME[c].gradient }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="pool-name">Name</label>
          <input
            id="pool-name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Ramadan Collection Capital"
            className={inputCls}
            autoFocus
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="pool-amount">Injected amount (EGP)</label>
          <input
            id="pool-amount"
            type="number"
            min="0"
            inputMode="numeric"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            placeholder="250,000"
            className={inputCls}
          />
          {editing && spent > 0 && (
            <p className="text-[0.62rem] text-text-tertiary mt-[6px]">{formatEGP(spent)} already spent from this pool.</p>
          )}
        </div>

        {error && <p className="text-[0.7rem] text-[#e07070]">{error}</p>}
      </div>

      <div className="px-5 py-4 border-t border-border shrink-0 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-[9px] border border-border px-4 py-[7px] text-[0.72rem] text-text-secondary hover:border-border-md hover:text-text-primary transition-all duration-150"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="rounded-[9px] bg-btn-bg text-btn-text px-4 py-[7px] text-[0.72rem] font-medium hover:opacity-90 transition-opacity duration-150"
        >
          {editing ? 'Save changes' : 'Create pool'}
        </button>
      </div>
    </DashboardModal>
  );
}

export default function IvyCapital() {
  const state = useIvy();
  const [addOpen, setAddOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<Capital | null>(null);
  const [mintedId, setMintedId] = useState<string | null>(null);

  // Let the Mint play once, then return the card to normal hover behavior.
  useEffect(() => {
    if (!mintedId) return;
    const t = setTimeout(() => setMintedId(null), 1800);
    return () => clearTimeout(t);
  }, [mintedId]);

  const totalInjected = state.capitals.reduce((s, c) => s + c.initial_amount, 0);
  const totalRemaining = state.capitals.reduce((s, c) => s + c.current_balance, 0);

  const addButton = (
    <button
      onClick={() => setAddOpen(true)}
      className="flex items-center gap-[6px] rounded-[9px] bg-btn-bg text-btn-text px-3 py-[7px] text-[0.72rem] font-medium hover:opacity-90 transition-opacity duration-150"
    >
      <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
      Add pool
    </button>
  );

  return (
    <IvyShell
      title="capital"
      subtitle={`${formatEGP(totalRemaining)} remaining of ${formatEGP(totalInjected)} injected across ${state.capitals.length} pool${state.capitals.length !== 1 ? 's' : ''}`}
      actions={addButton}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-start max-w-[980px]">
        {state.capitals.map((pool, i) => (
          <PoolUnit
            key={pool.id}
            pool={pool}
            index={i}
            minted={pool.id === mintedId}
            onEdit={() => setEditingPool(pool)}
          />
        ))}
      </div>

      {addOpen && <PoolModal onClose={() => setAddOpen(false)} onCreated={(row) => setMintedId(row.id)} />}
      {editingPool && <PoolModal pool={editingPool} onClose={() => setEditingPool(null)} />}
    </IvyShell>
  );
}
