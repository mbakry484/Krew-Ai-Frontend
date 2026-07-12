'use client';

import { useEffect, useState } from 'react';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';

// Step 3 — Connect Telegram. Shows the single-use linking code + an "open
// Telegram" deep link, then watches for confirmation and animates a teal pulse
// on success. Skippable ("I'll do this later") — a persistent banner then nags
// on Overview until it's linked (see TelegramLinkBanner).
//
// The confirmation is observed reactively from the store. In production this
// same success flip is driven by polling GET /api/ivy/onboarding/status; the
// mock client simulates it a few seconds after the code is issued.

function TelegramGlyph({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export default function OnboardingTelegram({
  onNext,
  onBack,
  onSkip,
}: {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const { telegramLinkCode, onboarding } = useIvy();
  const linked = onboarding.telegramLinked;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!telegramLinkCode) ivyClient.fetchTelegramLinkCode();
  }, [telegramLinkCode]);

  const copyCode = async () => {
    if (!telegramLinkCode) return;
    try {
      await navigator.clipboard.writeText(telegramLinkCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the code is on screen to type */
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-[1.5rem] font-light tracking-[-0.03em] text-text-primary lowercase">
          connect telegram
        </h2>
        <p className="text-[0.78rem] text-text-secondary leading-[1.6] mt-2 max-w-[440px] mx-auto">
          log expenses by text or voice — just message Ivy. open the link, tap start, and Ivy binds
          this brand to your chat.
        </p>
      </div>

      {/* Link card */}
      <div
        className={`relative overflow-hidden rounded-[18px] border p-6 text-center transition-colors duration-300 ${
          linked ? 'border-ivy-accent-border ivy-link-success' : 'border-border'
        } bg-background`}
      >
        {linked ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <span className="w-[52px] h-[52px] rounded-full border border-ivy-accent-border bg-ivy-accent/10 flex items-center justify-center text-ivy-accent">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <div className="text-[0.95rem] text-text-primary">Telegram connected</div>
            <div className="text-[0.72rem] text-text-secondary">
              You can now log expenses straight from your chat with Ivy.
            </div>
          </div>
        ) : (
          <>
            <div className="text-[0.6rem] uppercase tracking-[0.1em] text-text-tertiary mb-3">
              Your linking code
            </div>
            <div className="text-[2rem] font-light tracking-[0.14em] text-text-primary tabular-nums select-all">
              {telegramLinkCode?.code ?? '········'}
            </div>
            <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
              <a
                href={telegramLinkCode?.deepLink ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => ivyClient.armTelegramLinkSimulation()}
                className="flex items-center gap-2 rounded-[10px] bg-ivy-accent text-white px-5 py-[9px] text-[0.78rem] font-medium hover:opacity-90 transition-opacity duration-150"
              >
                <TelegramGlyph className="w-[15px] h-[15px]" />
                Open Telegram
              </a>
              <button
                onClick={copyCode}
                className="rounded-[10px] border border-border text-text-secondary px-4 py-[9px] text-[0.78rem] hover:border-border-md hover:text-text-primary transition-colors duration-150"
              >
                {copied ? 'Copied' : 'Copy code'}
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-[0.66rem] text-text-tertiary">
              <span className="w-[6px] h-[6px] rounded-full bg-ivy-accent animate-pulse" />
              waiting for you to tap start in Telegram…
            </div>
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="text-[0.74rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          {!linked && (
            <button
              onClick={onSkip}
              className="text-[0.74rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
            >
              I&apos;ll do this later
            </button>
          )}
          <button
            onClick={onNext}
            className="rounded-[10px] bg-btn-bg text-btn-text px-6 py-[9px] text-[0.78rem] font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
