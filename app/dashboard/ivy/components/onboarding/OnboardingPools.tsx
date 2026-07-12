'use client';

import { useState } from 'react';
import CapitalCard, { cardDigits } from '../CapitalCard';
import { CARD_THEME } from '../cardThemes';
import { formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';
import { CAPITAL_COLORS, CapitalColor } from '@/lib/ivy/types';

// Step 2 — Create your first capital pool. Reuses the exact Visa-style card UI
// (CapitalCard) with a live preview as the founder types. At least one pool is
// required to continue; up to 3 can be added here, more later from Capital.

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
  const canContinue = capitals.length >= 1;

  const addPool = () => {
    const value = Number(amount);
    if (!name.trim()) {
      setError('Give the pool a name.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an opening balance greater than zero.');
      return;
    }
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
      {!atLimit && (
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

            <button
              onClick={addPool}
              className="self-start rounded-[9px] border border-ivy-accent-border text-ivy-accent px-4 py-[8px] text-[0.74rem] font-medium hover:bg-ivy-accent/10 transition-colors duration-150"
            >
              {capitals.length === 0 ? 'Add this pool' : 'Add another pool'}
            </button>
          </div>
        </div>
      )}

      {atLimit && (
        <p className="text-[0.72rem] text-text-tertiary text-center">
          {MAX_POOLS} pools added — you can add more later from Capital.
        </p>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="text-[0.74rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="rounded-[10px] bg-btn-bg text-btn-text px-6 py-[9px] text-[0.78rem] font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          title={canContinue ? undefined : 'Add at least one pool with a balance to continue'}
        >
          Continue
        </button>
      </div>

      {canContinue && (
        <p className="text-center text-[0.66rem] text-text-tertiary -mt-3">
          {formatEGP(capitals.reduce((s, c) => s + c.current_balance, 0))} across{' '}
          {capitals.length} pool{capitals.length !== 1 ? 's' : ''} — nothing works without at least one.
        </p>
      )}
    </div>
  );
}
