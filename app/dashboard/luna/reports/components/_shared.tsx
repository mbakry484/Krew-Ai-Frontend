'use client';

// Generic primitives (formatters, Delta, SectionCard, skeleton/empty states)
// were promoted to components/DashboardPrimitives.tsx so the Ivy dashboard can
// reuse them. Re-exported here so existing report imports keep working.
export {
  formatEGP,
  formatDuration,
  formatRelative,
  timeAgo,
  Delta,
  SectionCard,
  SkeletonRows,
  EmptyState,
} from '@/components/DashboardPrimitives';

// ─── Luna-specific colour/label maps (match Issues page) ──────────────────────
export const SENTIMENT_COLORS: Record<string, string> = {
  happy: '#6bcf8f',
  neutral: 'var(--text-tertiary)',
  frustrated: '#d4845c',
};

export const SENTIMENT_LABEL: Record<string, string> = {
  happy: 'Happy',
  neutral: 'Neutral',
  frustrated: 'Frustrated',
};

export const INTENT_LABEL: Record<string, string> = {
  order: 'Order',
  exchange: 'Exchange',
  refund: 'Refund',
  faq: 'FAQ',
};
