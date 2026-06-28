'use client';

import Modal from './Modal';
import { DrillRow } from '../mockReportsData';
import {
  SENTIMENT_COLORS,
  SENTIMENT_LABEL,
  INTENT_LABEL,
  formatEGP,
  formatDuration,
  formatRelative,
  SkeletonRows,
  EmptyState,
} from './_shared';

/**
 * Right slide-over showing the conversation rows behind a clicked stat.
 * Rows are mock for now; each is clickable (stub → would deep-link into the
 * Conversations page with the conversation pre-opened).
 */
export default function DrillDownPanel({
  title,
  subtitle,
  rows,
  loading,
  onClose,
  onOpenConversation,
}: {
  title: string;
  subtitle: string;
  rows: DrillRow[];
  loading: boolean;
  onClose: () => void;
  onOpenConversation: (row: DrillRow) => void;
}) {
  return (
    <Modal onClose={onClose} labelledBy="drilldown-title" variant="side">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
        <div>
          <div id="drilldown-title" className="text-[0.82rem] font-medium text-text-primary">{title}</div>
          <div className="text-[0.64rem] text-text-tertiary mt-[2px]">{subtitle}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-[6px]">
        {loading ? (
          <SkeletonRows count={5} height={72} />
        ) : rows.length === 0 ? (
          <EmptyState text="no conversations behind this number yet" />
        ) : (
          rows.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpenConversation(r)}
              className="flex flex-col gap-[4px] bg-background2 border border-border rounded-[8px] px-4 py-3 hover:border-border-md transition-colors text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.73rem] text-text-primary">{r.customer}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[0.58rem] px-[6px] py-[2px] rounded-full border"
                    style={{ color: SENTIMENT_COLORS[r.sentiment], borderColor: SENTIMENT_COLORS[r.sentiment] }}
                  >
                    {SENTIMENT_LABEL[r.sentiment]}
                  </span>
                  <span className="text-[0.6rem] text-text-tertiary">{formatRelative(r.startedAt)}</span>
                </div>
              </div>
              <div className="text-[0.67rem] text-text-secondary leading-[1.45]">{r.summary}</div>
              <div className="flex items-center gap-3 mt-[2px] text-[0.6rem] text-text-tertiary">
                <span className="px-[6px] py-[1px] rounded-full bg-background3 border border-border">{INTENT_LABEL[r.intent]}</span>
                {typeof r.value === 'number' && <span>{formatEGP(r.value)}</span>}
                {typeof r.durationSec === 'number' && <span>{formatDuration(r.durationSec)}</span>}
                <span className="ml-auto flex items-center gap-1">
                  <svg className="w-[9px] h-[9px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
                  open
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
