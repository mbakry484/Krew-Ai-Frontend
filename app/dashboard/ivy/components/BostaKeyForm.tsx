'use client';

import { useState } from 'react';
import { ivyClient } from '@/lib/ivy/ivyClient';

const inputCls =
  'w-full bg-input-bg border border-border rounded-[8px] pl-3 pr-9 py-2 text-[0.82rem] text-text-primary placeholder:text-text-tertiary focus:border-border-hover focus:outline-none transition-colors duration-150';
const labelCls = 'text-[0.62rem] uppercase tracking-[0.08em] text-text-tertiary mb-[6px] block';

/**
 * The Bosta API-key input + verify/connect flow — shared by the onboarding
 * step (OnboardingBosta) and the Settings "Connect"/"Reconnect" modal, so the
 * two surfaces can't drift. Not optimistic: the backend verifies the key
 * against Bosta before saving, so this awaits the real result and shows
 * Bosta's own error message verbatim on failure.
 */
export default function BostaKeyForm({
  onSuccess,
  submitLabel = 'Connect',
}: {
  onSuccess: () => void;
  submitLabel?: string;
}) {
  const [apiKey, setApiKey] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!apiKey.trim()) {
      setError('Paste your Bosta API key.');
      return;
    }
    setConnecting(true);
    setError('');
    try {
      await ivyClient.connectBosta(apiKey.trim());
      onSuccess();
    } catch (e: any) {
      setError(e?.message || 'Could not verify this key. Check it and try again.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className={labelCls} htmlFor="bosta-api-key">Bosta API key</label>
        <div className="relative">
          <input
            id="bosta-api-key"
            type={revealed ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Paste your key"
            autoFocus
            disabled={connecting}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide key' : 'Show key'}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors duration-150 p-1"
          >
            {revealed ? (
              <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.6 21.6 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.6 21.6 0 01-2.61 3.94M14.12 14.12a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          className="mt-2 text-[0.66rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
        >
          {showHelp ? 'hide' : 'how do I get this key?'}
        </button>
        {showHelp && (
          <ol className="mt-2 flex flex-col gap-1 text-[0.68rem] text-text-secondary leading-[1.6] list-decimal list-inside">
            <li>open business.bosta.co → Settings</li>
            <li>go to API Integration</li>
            <li>generate a key (2FA required)</li>
          </ol>
        )}
      </div>

      {error && <p className="text-[0.72rem] text-[#e07070]">{error}</p>}

      <button
        onClick={submit}
        disabled={connecting}
        className="self-start rounded-[10px] bg-btn-bg text-btn-text px-6 py-[9px] text-[0.78rem] font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-60"
      >
        {connecting ? 'Verifying…' : submitLabel}
      </button>
    </div>
  );
}
