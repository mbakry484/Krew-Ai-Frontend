'use client';

import { useState } from 'react';
import BostaConnectModal from './BostaConnectModal';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient, selectShowBostaBanner } from '@/lib/ivy/ivyClient';
import { bostaStatusCopy } from '@/lib/ivy/types';

// Persistent, dismissable nudge on Overview once onboarding is complete and
// Bosta isn't actively connected (skipped, or a live connection went bad).
// Styled exactly like TelegramLinkBanner so it reads as Ivy speaking, not an
// ERP alert bar. Reappears if connectionStatus later drops out of 'active'.

export default function BostaBanner() {
  const state = useIvy();
  const [modalOpen, setModalOpen] = useState(false);
  const show = selectShowBostaBanner(state);

  if (!show) return null;

  const status = state.bostaStatus?.connectionStatus ?? null;
  const reconnect = status !== null;

  return (
    <div
      className="relative overflow-hidden flex items-center gap-3 rounded-[16px] border border-border px-4 py-3"
      style={{
        background:
          'linear-gradient(95deg, hsl(152 55% 55% / 0.09) 0%, hsl(152 55% 55% / 0.02) 45%, transparent 100%)',
      }}
    >
      <span className="shrink-0 w-[26px] h-[26px] rounded-[8px] bg-background3 border border-border flex items-center justify-center text-ivy-accent">
        <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7" />
        </svg>
      </span>
      <span className="flex-1 min-w-0 text-[0.74rem] text-text-secondary leading-[1.55]">
        <span className="text-[0.6rem] uppercase tracking-[0.1em] text-text-tertiary mr-2 align-middle">Ivy says</span>
        {bostaStatusCopy(status as Exclude<typeof status, 'active'>)}
      </span>
      <button
        onClick={() => setModalOpen(true)}
        className="shrink-0 rounded-[8px] border border-ivy-accent-border text-ivy-accent px-3 py-[5px] text-[0.68rem] hover:bg-ivy-accent/10 transition-colors duration-150"
      >
        {reconnect ? 'Reconnect' : 'Connect'}
      </button>
      <button
        onClick={() => ivyClient.dismissBostaBanner()}
        aria-label="Dismiss"
        className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors duration-150 p-[2px]"
      >
        <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {modalOpen && <BostaConnectModal reconnect={reconnect} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
