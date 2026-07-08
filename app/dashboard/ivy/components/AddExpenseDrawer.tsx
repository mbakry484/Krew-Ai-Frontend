'use client';

import { useState } from 'react';
import DashboardModal from '@/components/DashboardModal';
import { formatEGP } from '@/components/DashboardPrimitives';
import { ivyClient } from '@/lib/ivy/ivyClient';
import {
  Capital,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_SOURCES,
  EXPENSE_SOURCE_LABEL,
  ExpenseCategory,
  ExpenseSource,
} from '@/lib/ivy/types';

const inputCls =
  'w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.78rem] text-text-primary placeholder:text-text-tertiary focus:border-border-hover focus:outline-none transition-colors duration-150';

const labelCls = 'text-[0.62rem] uppercase tracking-[0.08em] text-text-tertiary mb-[6px] block';

/**
 * Right slide-over for logging an expense — reuses the shared DashboardModal
 * drawer (same shell as Luna's reports drill-down). Writes through ivyClient,
 * which updates breakdowns, capital balances, net profit, and activity.
 */
export default function AddExpenseDrawer({
  capitals,
  onClose,
}: {
  capitals: Capital[];
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('inventory_materials');
  const [capitalId, setCapitalId] = useState(capitals[0]?.id ?? '');
  const [source, setSource] = useState<ExpenseSource>('text');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');

  const pool = capitals.find((c) => c.id === capitalId);

  const submit = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!pool) {
      setError('Pick a capital pool to deduct from.');
      return;
    }
    if (value > pool.current_balance) {
      setError(`That exceeds ${pool.name}'s balance (${formatEGP(pool.current_balance)}).`);
      return;
    }
    ivyClient.addExpense({
      amount: value,
      category,
      capital_id: pool.id,
      source,
      note: note.trim() || EXPENSE_CATEGORY_LABEL[category],
      spent_at: new Date(`${date}T12:00:00`).toISOString(),
    });
    onClose();
  };

  return (
    <DashboardModal onClose={onClose} labelledBy="add-expense-title" variant="side">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
        <div>
          <div id="add-expense-title" className="text-[0.82rem] font-medium text-text-primary">Add expense</div>
          <div className="text-[0.64rem] text-text-tertiary mt-[2px]">deducted from a capital pool, reflected everywhere</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-4">
        <div>
          <label className={labelCls} htmlFor="expense-amount">Amount (EGP)</label>
          <input
            id="expense-amount"
            type="number"
            min="0"
            inputMode="numeric"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            placeholder="20,000"
            className={inputCls}
            autoFocus
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="expense-category">Category</label>
          <select
            id="expense-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className={inputCls}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="expense-pool">Deduct from</label>
          <select
            id="expense-pool"
            value={capitalId}
            onChange={(e) => { setCapitalId(e.target.value); setError(''); }}
            className={inputCls}
          >
            {capitals.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {formatEGP(c.current_balance)} left
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className={labelCls}>Source</span>
          <div className="inline-flex rounded-[9px] border border-border p-[3px] bg-background" role="radiogroup" aria-label="Source">
            {EXPENSE_SOURCES.map((s) => {
              const active = source === s;
              return (
                <button
                  key={s}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSource(s)}
                  className={`px-3 py-[5px] rounded-[6px] text-[0.7rem] transition-colors duration-150 ${
                    active ? 'bg-background2 text-text-primary border border-border-md' : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {EXPENSE_SOURCE_LABEL[s]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="expense-note">Note</label>
          <textarea
            id="expense-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="bought fabrics for 20K"
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="expense-date">Date</label>
          <input
            id="expense-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
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
          Log expense
        </button>
      </div>
    </DashboardModal>
  );
}
