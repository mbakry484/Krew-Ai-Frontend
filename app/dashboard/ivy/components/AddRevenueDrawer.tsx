'use client';

import { useState } from 'react';
import DashboardModal from '@/components/DashboardModal';
import { formatEGP } from '@/components/DashboardPrimitives';
import { ivyClient, IvyState } from '@/lib/ivy/ivyClient';
import { channelColor } from './channelColors';
import {
  REVENUE_CHANNEL_KIND_LABEL,
  REVENUE_CHANNEL_KINDS,
  RevenueChannelKind,
} from '@/lib/ivy/types';

const inputCls =
  'w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.78rem] text-text-primary placeholder:text-text-tertiary focus:border-border-hover focus:outline-none transition-colors duration-150';
const labelCls = 'text-[0.62rem] uppercase tracking-[0.08em] text-text-tertiary mb-[6px] block';

/**
 * Right slide-over for logging revenue — a showroom payout, a stockist
 * settlement, a pop-up weekend. Existing channels are picked as chips; the
 * "+ New channel" chip flips the drawer into channel creation inline, so a
 * brand's first showroom entry is one flow, not two. Writes through ivyClient
 * so net revenue, net profit, and the overview react instantly.
 */
export default function AddRevenueDrawer({
  state,
  onClose,
}: {
  state: IvyState;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  // Default to the first manual-friendly channel; fall back to the first channel.
  const defaultChannel = state.revenueChannels.find((c) => c.kind !== 'online') ?? state.revenueChannels[0];

  const [channelId, setChannelId] = useState<string | 'new'>(defaultChannel?.id ?? 'new');
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<RevenueChannelKind>('showroom');
  const [gross, setGross] = useState('');
  const [returns, setReturns] = useState('');
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');

  const creatingChannel = channelId === 'new';

  const submit = () => {
    const grossValue = Number(gross);
    const returnsValue = returns.trim() === '' ? 0 : Number(returns);
    if (creatingChannel && !newName.trim()) {
      setError('Name the new channel.');
      return;
    }
    if (!Number.isFinite(grossValue) || grossValue <= 0) {
      setError('Enter a revenue amount greater than zero.');
      return;
    }
    if (!Number.isFinite(returnsValue) || returnsValue < 0 || returnsValue > grossValue) {
      setError('Returns must be between zero and the revenue amount.');
      return;
    }
    const targetChannelId = creatingChannel
      ? ivyClient.addRevenueChannel({ name: newName.trim(), kind: newKind }).id
      : channelId;
    ivyClient.addRevenueEntry({
      channel_id: targetChannelId,
      date: new Date(`${date}T12:00:00`).toISOString(),
      gross: grossValue,
      returns: returnsValue,
    });
    onClose();
  };

  return (
    <DashboardModal onClose={onClose} labelledBy="add-revenue-title" variant="side">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
        <div>
          <div id="add-revenue-title" className="text-[0.82rem] font-medium text-text-primary">Add revenue</div>
          <div className="text-[0.64rem] text-text-tertiary mt-[2px]">showrooms, stockists, pop-ups — anything beyond online</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-5">
        {/* Channel picker */}
        <div>
          <span className={labelCls}>Channel</span>
          <div className="flex flex-wrap gap-[6px]" role="radiogroup" aria-label="Revenue channel">
            {state.revenueChannels.map((c) => {
              const active = channelId === c.id;
              return (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => { setChannelId(c.id); setError(''); }}
                  className={`flex items-center gap-[7px] px-3 py-[6px] rounded-full border text-[0.7rem] transition-all duration-150 ${
                    active
                      ? 'border-border-hover bg-background3 text-text-primary'
                      : 'border-border text-text-secondary hover:border-border-md hover:text-text-primary'
                  }`}
                >
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: channelColor(state, c.id), boxShadow: active ? `0 0 6px ${channelColor(state, c.id)}` : 'none' }}
                  />
                  {c.name}
                  {c.kind === 'online' && <span className="text-[0.55rem] uppercase tracking-[0.06em] text-text-tertiary">auto</span>}
                </button>
              );
            })}
            <button
              role="radio"
              aria-checked={creatingChannel}
              onClick={() => { setChannelId('new'); setError(''); }}
              className={`flex items-center gap-[6px] px-3 py-[6px] rounded-full border border-dashed text-[0.7rem] transition-all duration-150 ${
                creatingChannel
                  ? 'border-border-hover bg-background3 text-text-primary'
                  : 'border-border text-text-tertiary hover:border-border-md hover:text-text-secondary'
              }`}
            >
              <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              New channel
            </button>
          </div>

          {/* Inline new-channel form — expands under the chips */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
            style={{ gridTemplateRows: creatingChannel ? '1fr' : '0fr' }}
            aria-hidden={!creatingChannel}
          >
            <div className="overflow-hidden">
              <div className="mt-3 rounded-[10px] border border-border bg-background2 px-4 py-4 flex flex-col gap-3">
                <div>
                  <label className={labelCls} htmlFor="channel-name">Channel name</label>
                  <input
                    id="channel-name"
                    value={newName}
                    onChange={(e) => { setNewName(e.target.value); setError(''); }}
                    placeholder="City Stars Kiosk"
                    className={inputCls}
                    tabIndex={creatingChannel ? 0 : -1}
                  />
                </div>
                <div>
                  <span className={labelCls}>Type</span>
                  <div className="flex flex-wrap gap-[5px]">
                    {REVENUE_CHANNEL_KINDS.filter((k) => k !== 'online').map((k) => {
                      const active = newKind === k;
                      return (
                        <button
                          key={k}
                          onClick={() => setNewKind(k)}
                          aria-pressed={active}
                          tabIndex={creatingChannel ? 0 : -1}
                          className={`px-[10px] py-[5px] rounded-full border text-[0.66rem] transition-all duration-150 ${
                            active
                              ? 'border-border-hover bg-background text-text-primary'
                              : 'border-border text-text-tertiary hover:border-border-md hover:text-text-secondary'
                          }`}
                        >
                          {REVENUE_CHANNEL_KIND_LABEL[k]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="revenue-gross">Revenue (EGP)</label>
          <input
            id="revenue-gross"
            type="number"
            min="0"
            inputMode="numeric"
            value={gross}
            onChange={(e) => { setGross(e.target.value); setError(''); }}
            placeholder="45,000"
            className={inputCls}
            autoFocus
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="revenue-returns">Returns (EGP) <span className="normal-case tracking-normal text-text-tertiary">— optional</span></label>
          <input
            id="revenue-returns"
            type="number"
            min="0"
            inputMode="numeric"
            value={returns}
            onChange={(e) => { setReturns(e.target.value); setError(''); }}
            placeholder="0"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="revenue-date">Date</label>
          <input
            id="revenue-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Net preview */}
        {Number(gross) > 0 && (
          <div className="flex items-center justify-between rounded-[10px] border border-border bg-background2 px-4 py-3">
            <span className="text-[0.68rem] text-text-tertiary">Net revenue logged</span>
            <span className="text-[0.8rem] text-text-primary tabular-nums">
              {formatEGP(Math.max(0, (Number(gross) || 0) - (Number(returns) || 0)))}
            </span>
          </div>
        )}

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
          Log revenue
        </button>
      </div>
    </DashboardModal>
  );
}
