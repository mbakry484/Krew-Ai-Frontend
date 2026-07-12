'use client';

import { useIvy } from '@/components/IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';

// Persistent, dismissable nudge on Overview after onboarding — stays until
// Telegram is linked (TASK 1, step 3 skip path). Styled like AgentSays so it
// reads as Ivy speaking, not an ERP alert bar.

export default function TelegramLinkBanner() {
  const { onboarding } = useIvy();
  const show =
    onboarding.hydrated &&
    onboarding.completed &&
    !onboarding.telegramLinked &&
    !onboarding.bannerDismissed;

  if (!show) return null;

  return (
    <div
      className="relative overflow-hidden flex items-center gap-3 rounded-[16px] border border-border px-4 py-3"
      style={{
        background:
          'linear-gradient(95deg, hsl(152 55% 55% / 0.09) 0%, hsl(152 55% 55% / 0.02) 45%, transparent 100%)',
      }}
    >
      <span className="shrink-0 w-[26px] h-[26px] rounded-[8px] bg-background3 border border-border flex items-center justify-center text-ivy-accent">
        <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13" />
          <path d="M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </span>
      <span className="flex-1 min-w-0 text-[0.74rem] text-text-secondary leading-[1.55]">
        <span className="text-[0.6rem] uppercase tracking-[0.1em] text-text-tertiary mr-2 align-middle">Ivy says</span>
        Connect Telegram so you and your team can log expenses by text or voice — I&apos;ll keep this
        here until it&apos;s linked.
      </span>
      <button
        onClick={() => ivyClient.reopenTelegramStep()}
        className="shrink-0 rounded-[8px] border border-ivy-accent-border text-ivy-accent px-3 py-[5px] text-[0.68rem] hover:bg-ivy-accent/10 transition-colors duration-150"
      >
        Connect
      </button>
      <button
        onClick={() => ivyClient.dismissOnboardingBanner()}
        aria-label="Dismiss"
        className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors duration-150 p-[2px]"
      >
        <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
