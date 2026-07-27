'use client';

import { useState } from 'react';
import IvyShell from '../components/IvyShell';
import TeamSection from '../components/TeamSection';
import AlertPreferencesSection from '../components/AlertPreferences';
import BostaConnectModal from '../components/BostaConnectModal';
import { SectionCard, timeAgo } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';
import { bostaStatusCopy } from '@/lib/ivy/types';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// GET/PUT /api/ivy/settings
//   { ivy_enabled: boolean, currency: 'EGP' }
//
// --- TELEGRAM (expense-logging agent) — WIRED (see Team section) ---
// GET    /members                    → BrandMember[]
// POST   /members                    Body: { name, role, phone? }
// DELETE /members/:id
// POST   /members/:id/telegram-link  → { link, expires_at }  (single-use deep link)
// =============================================================================

/** teal for live, coral for anything needing attention — no new colors. */
const STATUS_PILL: Record<'live' | 'attention' | 'off', string> = {
  live: 'text-ivy-accent border-ivy-accent-border',
  attention: 'text-[#e07070] border-[#e07070]/40',
  off: 'text-text-tertiary border-border',
};

export default function IvySettings() {
  const { ivyEnabled, bostaStatus } = useIvy();
  const [bostaModal, setBostaModal] = useState<'connect' | 'reconnect' | null>(null);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  const bostaState = bostaStatus?.connectionStatus ?? null;
  const bostaNeedsAttention = bostaState === 'invalid' || bostaState === 'ip_blocked' || bostaState === 'error';

  return (
    <IvyShell title="settings" subtitle="how Ivy runs and where her data comes from">
      <SectionCard title="Agent" subtitle="global switch — mirrors the toggle in the top bar">
        <div className="flex items-center justify-between bg-background2 border border-border rounded-[10px] px-4 py-3">
          <div>
            <div className="text-[0.75rem] text-text-primary mb-[2px]">Ivy is {ivyEnabled ? 'live' : 'offline'}</div>
            <div className="text-[0.66rem] text-text-tertiary">
              {ivyEnabled
                ? 'Tracking expenses, capital, and returns in real time.'
                : 'Paused — nothing is being tracked or logged.'}
            </div>
          </div>
          <button
            onClick={() => ivyClient.toggleIvyEnabled()}
            role="switch"
            aria-checked={ivyEnabled}
            aria-label="Toggle Ivy"
            className={`relative w-[38px] h-[21px] rounded-full transition-colors duration-200 shrink-0 ${
              ivyEnabled ? 'bg-ivy-accent' : 'bg-border-md'
            }`}
          >
            <span
              className={`absolute top-[3px] w-[15px] h-[15px] rounded-full bg-background transition-all duration-200 ${
                ivyEnabled ? 'left-[20px]' : 'left-[3px]'
              }`}
            />
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Alerts" subtitle="what Ivy watches for — quietly, and only when it matters">
        <AlertPreferencesSection />
      </SectionCard>

      <SectionCard title="Team" subtitle="add media buyers who log expenses to Ivy over Telegram">
        <TeamSection />
      </SectionCard>

      <SectionCard title="Currency" subtitle="all amounts across the Ivy dashboard">
        <div className="flex items-center justify-between bg-background2 border border-border rounded-[10px] px-4 py-3">
          <div>
            <div className="text-[0.75rem] text-text-primary mb-[2px]">Egyptian Pound (EGP)</div>
            <div className="text-[0.66rem] text-text-tertiary">Multi-currency support is on the roadmap.</div>
          </div>
          <span className="text-[0.6rem] uppercase tracking-[0.05em] text-text-tertiary border border-border rounded px-[7px] py-[2px]">
            locked
          </span>
        </div>
      </SectionCard>

      <SectionCard title="Data Sources" subtitle="where Ivy's numbers come from">
        <div id="data-sources" className="flex flex-col gap-2 scroll-mt-6">
          <div className="bg-background2 border border-border rounded-[10px] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-[32px] h-[32px] rounded-[9px] bg-background3 border border-border flex items-center justify-center text-text-secondary shrink-0">
                  <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="text-[0.75rem] text-text-primary mb-[2px]">Bosta</div>
                  <div className="text-[0.66rem] text-text-tertiary truncate">
                    {bostaState === 'active'
                      ? `last sync ${bostaStatus?.lastPollAt ? timeAgo(bostaStatus.lastPollAt) : 'just now'}`
                      : bostaNeedsAttention
                        ? bostaStatusCopy(bostaState as 'invalid' | 'ip_blocked' | 'error')
                        : 'Delivered vs returned COD orders — feeds net revenue and the return rate.'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[0.6rem] uppercase tracking-[0.05em] border rounded px-[7px] py-[2px] ${
                  bostaState === 'active' ? STATUS_PILL.live : bostaNeedsAttention ? STATUS_PILL.attention : STATUS_PILL.off
                }`}>
                  {bostaState === 'active' ? 'live' : bostaNeedsAttention ? 'needs attention' : 'not connected'}
                </span>
                {bostaState === 'active' ? (
                  !confirmingDisconnect && (
                    <button
                      onClick={() => setConfirmingDisconnect(true)}
                      className="text-[0.66rem] text-text-tertiary hover:text-[#e07070] transition-colors duration-150"
                    >
                      Disconnect
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => setBostaModal(bostaNeedsAttention ? 'reconnect' : 'connect')}
                    className="text-[0.66rem] text-ivy-accent border border-ivy-accent-border rounded-[7px] px-[10px] py-[5px] hover:bg-ivy-accent/10 transition-colors duration-150"
                  >
                    {bostaNeedsAttention ? 'Reconnect' : 'Connect'}
                  </button>
                )}
              </div>
            </div>

            {confirmingDisconnect && (
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[0.66rem] text-text-secondary leading-[1.5]">
                  This stops Ivy from reading your deliveries. Revenue will go dark. Proceed?
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setConfirmingDisconnect(false)}
                    className="text-[0.66rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150 px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { ivyClient.disconnectBosta(); setConfirmingDisconnect(false); }}
                    className="text-[0.66rem] text-[#e07070] border border-[#e07070]/40 rounded-[7px] px-[10px] py-[5px] hover:bg-[#e07070]/10 transition-colors duration-150"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-background2 border border-border rounded-[10px] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="w-[32px] h-[32px] rounded-[9px] bg-background3 border border-border flex items-center justify-center text-text-secondary">
                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </span>
              <div>
                <div className="text-[0.75rem] text-text-primary mb-[2px]">Telegram agent</div>
                <div className="text-[0.66rem] text-text-tertiary">
                  Log expenses by text — just message Ivy. Add people who can log in the Team section above.
                </div>
              </div>
            </div>
            <span className="text-[0.6rem] uppercase tracking-[0.05em] text-ivy-accent border border-ivy-accent-border rounded px-[7px] py-[2px] shrink-0">
              live
            </span>
          </div>
        </div>
      </SectionCard>

      {bostaModal && (
        <BostaConnectModal reconnect={bostaModal === 'reconnect'} onClose={() => setBostaModal(null)} />
      )}
    </IvyShell>
  );
}
