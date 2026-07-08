'use client';

import IvyShell from '../components/IvyShell';
import { SectionCard } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// GET/PUT /api/ivy/settings
//   { ivy_enabled: boolean, currency: 'EGP' }
//
// --- BOSTA (return + delivery data → revenue_snapshots) ---
// POST   /api/integrations/bosta/connect      Body: { api_key }
// DELETE /api/integrations/bosta/disconnect
//
// --- TELEGRAM (expense-logging agent) ---
// POST   /api/integrations/telegram/connect   → { bot_link }
// =============================================================================

export default function IvySettings() {
  const { ivyEnabled } = useIvy();

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

      <SectionCard title="Data Sources" subtitle="where Ivy's numbers will come from">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between bg-background2 border border-border rounded-[10px] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="w-[32px] h-[32px] rounded-[9px] bg-background3 border border-border flex items-center justify-center text-text-secondary">
                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7" />
                </svg>
              </span>
              <div>
                <div className="text-[0.75rem] text-text-primary mb-[2px]">Bosta</div>
                <div className="text-[0.66rem] text-text-tertiary">
                  Delivered vs returned COD orders — feeds net revenue and the return rate.
                </div>
              </div>
            </div>
            <span className="text-[0.6rem] uppercase tracking-[0.05em] text-text-tertiary border border-border rounded px-[7px] py-[2px] shrink-0">
              coming soon
            </span>
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
                  Log expenses by text, voice, or receipt photo. Preview it on the Activity page.
                </div>
              </div>
            </div>
            <span className="text-[0.6rem] uppercase tracking-[0.05em] text-ivy-accent border border-ivy-accent-border rounded px-[7px] py-[2px] shrink-0">
              preview
            </span>
          </div>
        </div>
      </SectionCard>
    </IvyShell>
  );
}
