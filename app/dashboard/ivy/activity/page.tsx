'use client';

import { useMemo } from 'react';
import IvyShell from '../components/IvyShell';
import { SourceIcon } from '../components/_ivyShared';
import { SectionCard, EmptyState, formatEGP, timeAgo } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { selectActivityFeed } from '@/lib/ivy/ivyClient';
import { EXPENSE_CATEGORY_LABEL, EXPENSE_SOURCE_LABEL } from '@/lib/ivy/types';

// Read-only mock of the Telegram slot-filling flow — a visual teaser of the
// agent. No real Telegram wiring; clearly marked as preview.
const TELEGRAM_PREVIEW: { from: 'user' | 'ivy'; kind?: 'voice'; text: string }[] = [
  { from: 'user', kind: 'voice', text: '“bought fabrics for 20K”' },
  { from: 'ivy', text: 'Got it — EGP 20,000 for Inventory & Materials. Deduct from Main Operating Capital?' },
  { from: 'user', text: 'yes' },
  { from: 'ivy', text: 'Logged ✓ EGP 20,000 · Inventory & Materials · Main Operating Capital — balance EGP 80,000.' },
];

export default function IvyActivity() {
  const state = useIvy();
  const feed = useMemo(() => selectActivityFeed(state), [state]);

  return (
    <IvyShell title="activity" subtitle="everything Ivy logged, from every channel">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        {/* Feed */}
        <SectionCard title="Log" subtitle={`${feed.length} entr${feed.length !== 1 ? 'ies' : 'y'}, newest first`}>
          {feed.length === 0 ? (
            <EmptyState text="nothing logged yet — add an expense to see it here" />
          ) : (
            <div className="flex flex-col gap-[6px]">
              {feed.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 bg-background2 border border-border rounded-[8px] px-4 py-3 hover:border-border-md transition-colors duration-150"
                >
                  <span
                    className="w-[28px] h-[28px] shrink-0 rounded-[8px] bg-background3 border border-border flex items-center justify-center text-text-secondary"
                    title={`Logged via ${EXPENSE_SOURCE_LABEL[e.source].toLowerCase()}`}
                  >
                    <SourceIcon source={e.source} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.73rem] text-text-primary truncate">{e.note}</div>
                    <div className="flex items-center gap-2 mt-[3px]">
                      <span className="text-[0.6rem] px-[7px] py-[1px] rounded-full bg-background border border-border text-text-tertiary">
                        {EXPENSE_CATEGORY_LABEL[e.category]}
                      </span>
                      <span className="text-[0.6rem] px-[7px] py-[1px] rounded-full bg-background border border-border text-text-tertiary flex items-center gap-[4px]">
                        <SourceIcon source={e.source} className="w-[9px] h-[9px]" />
                        {EXPENSE_SOURCE_LABEL[e.source]}
                      </span>
                      <span className="text-[0.62rem] text-text-tertiary">{timeAgo(e.spent_at)}</span>
                    </div>
                  </div>
                  <span className="text-[0.78rem] text-text-primary tabular-nums shrink-0">−{formatEGP(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Telegram agent preview */}
        <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
          <div className="flex items-center justify-between mb-[0.3rem]">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary">Telegram Agent</div>
            <span className="text-[0.55rem] uppercase tracking-[0.08em] text-ivy-accent border border-ivy-accent-border rounded-full px-[7px] py-[2px] leading-none">
              preview
            </span>
          </div>
          <p className="text-[0.68rem] text-text-secondary mb-4">
            log expenses by text, voice note, or receipt photo — Ivy fills in the rest
          </p>

          <div className="flex flex-col gap-2" aria-label="Example Telegram conversation (mock)">
            {TELEGRAM_PREVIEW.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-[12px] px-3 py-[0.55rem] text-[0.7rem] leading-[1.5] border ${
                    m.from === 'user'
                      ? 'bg-background4 border-border-md text-text-primary rounded-br-[4px]'
                      : 'bg-background2 border-border text-text-secondary rounded-bl-[4px]'
                  }`}
                >
                  {m.from === 'ivy' && (
                    <span className="block text-[0.55rem] uppercase tracking-[0.08em] text-ivy-accent mb-[3px]">Ivy</span>
                  )}
                  {m.kind === 'voice' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-[22px] h-[22px] shrink-0 rounded-full bg-background3 border border-border flex items-center justify-center text-text-secondary">
                        <SourceIcon source="voice" className="w-[10px] h-[10px]" />
                      </span>
                      <span className="flex items-center gap-[2px]" aria-hidden="true">
                        {[7, 11, 5, 12, 8, 4, 10, 6].map((h, j) => (
                          <span key={j} className="w-[2px] rounded-full bg-text-tertiary" style={{ height: h }} />
                        ))}
                      </span>
                      <span className="text-text-tertiary italic">{m.text}</span>
                    </span>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[0.62rem] text-text-tertiary mt-4 leading-[1.6]">
            This is a visual preview — the Telegram agent isn&apos;t wired up yet.
            When it ships, confirmed entries land in this feed automatically.
          </p>
        </div>
      </div>
    </IvyShell>
  );
}
