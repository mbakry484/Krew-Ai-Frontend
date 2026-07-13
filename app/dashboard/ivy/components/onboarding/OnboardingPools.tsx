'use client';

import { useState } from 'react';
import CapitalCard, { cardDigits } from '../CapitalCard';
import { CARD_THEME } from '../cardThemes';
import { formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';
import { CAPITAL_COLORS, CapitalColor } from '@/lib/ivy/types';

// Step 2 — Create your first capital pool. Reuses the Visa-style CapitalCard
// with a live preview as the founder types. One button: Continue commits the
// current pool (persisted to the backend — the card must survive a reload)
// and moves on. More pools can be added later from Capital.

const inputCls =
  'w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.82rem] text-text-primary placeholder:text-text-tertiary focus:border-border-hover focus:outline-none transition-colors duration-150';
const labelCls = 'text-[0.62rem] uppercase tracking-[0.08em] text-text-tertiary mb-[6px] block';

const MAX_POOLS = 3;

export default function OnboardingPools({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { capitals } = useIvy();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [color, setColor] = useState<CapitalColor>('teal');
  const [error, setError] = useState('');

  const numericAmount = Number(amount) || 0;
  const atLimit = capitals.length >= MAX_POOLS;

  // Commit the drafted pool (if any) and move on. The write is optimistic —
  // the flow proceeds instantly — but it also persists to the backend so the
  // card exists in the DB, not just this browser. Empty draft is fine as long
  // as a pool exists.
  const proceed = () => {
    const value = Number(amount);
    const hasDraft = name.trim() !== '' || amount.trim() !== '';

    if (hasDraft) {
      if (!name.trim()) { setError('Give the pool a name.'); return; }
      if (!Number.isFinite(value) || value <= 0) { setError('Enter an opening balance greater than zero.'); return; }
      if (!atLimit) ivyClient.addCapital({ name: name.trim(), initial_amount: value, color });
    } else if (capitals.length === 0) {
      setError('Add a pool — a name and the cash sitting in it right now.');
      return;
    }
    onNext();
  };

  // Optional: bank the current pool and clear the form to add another.
  const addAnother = () => {
    const value = Number(amount);
    if (!name.trim()) { setError('Give the pool a name.'); return; }
    if (!Number.isFinite(value) || value <= 0) { setError('Enter an opening balance greater than zero.'); return; }
    ivyClient.addCapital({ name: name.trim(), initial_amount: value, color });
    setName('');
    setAmount('');
    setColor('teal');
    setError('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-[1.5rem] font-light tracking-[-0.03em] text-text-primary lowercase">
          create your first capital pool
        </h2>
        <p className="text-[0.78rem] text-text-secondary leading-[1.6] mt-2 max-w-[440px] mx-auto">
          how much cash is sitting in this pool right now? that&apos;s your starting point — Ivy
          tracks every pound from here.
        </p>
      </div>

      {/* Already-created pools */}
      {capitals.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className={labelCls}>Pools added</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {capitals.slice(0, MAX_POOLS).map((pool) => (
              <CapitalCard
                key={pool.id}
                size="sm"
                name={pool.name}
                injected={pool.initial_amount}
                balance={pool.current_balance}
                color={pool.color}
                digits={cardDigits(pool.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Draft form + live preview */}
      {!atLimit ? (
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 items-start">
          <div className="cap-preview">
            <CapitalCard
              name={name}
              injected={numericAmount}
              balance={numericAmount}
              color={color}
              digits="0000"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className={labelCls} htmlFor="onb-pool-name">Pool name</label>
              <input
                id="onb-pool-name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Instapay, Bank, Vault…"
                className={inputCls}
                autoFocus
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="onb-pool-amount">Opening balance (EGP)</label>
              <input
                id="onb-pool-amount"
                type="number"
                min="0"
                inputMode="numeric"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                placeholder="250,000"
                className={inputCls}
              />
            </div>

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

            {error && <p className="text-[0.72rem] text-[#e07070]">{error}</p>}

            {capitals.length < MAX_POOLS - 1 && (
              <button
                onClick={addAnother}
                className="self-start text-[0.72rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
              >
                + Save &amp; add another pool
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[0.72rem] text-text-tertiary text-center">
          {MAX_POOLS} pools added — you can add more later from Capital.
        </p>
      )}

      {/* Footer actions — single primary Continue */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="text-[0.74rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
        >
          Back
        </button>
        <button
          onClick={proceed}
          className="rounded-[10px] bg-btn-bg text-btn-text px-6 py-[9px] text-[0.78rem] font-medium hover:opacity-90 transition-opacity duration-150"
        >
          Continue
        </button>
      </div>

      {capitals.length > 0 && (
        <p className="text-center text-[0.66rem] text-text-tertiary -mt-3">
          {formatEGP(capitals.reduce((s, c) => s + c.current_balance, 0))} tracked across{' '}
          {capitals.length} pool{capitals.length !== 1 ? 's' : ''}.
        </p>
      )}
    </div>
  );
}
