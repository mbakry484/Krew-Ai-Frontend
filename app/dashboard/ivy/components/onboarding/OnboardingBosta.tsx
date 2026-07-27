'use client';

import { useEffect, useState } from 'react';
import BostaKeyForm from '../BostaKeyForm';

// Step 4 — Connect Bosta. Ivy reads delivered/returned COD orders through it to
// turn "orders on a screen" into real revenue. Skippable — the founder lands on
// `done` either way; skipping leaves the Overview/Revenue "connect Bosta" nudge
// showable (see selectShowBostaBanner), it does not set any dismissed flag.

export default function OnboardingBosta({
  onNext,
  onBack,
  onSkip,
}: {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!connected) return;
    const t = setTimeout(onNext, 1500);
    return () => clearTimeout(t);
  }, [connected, onNext]);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-[1.5rem] font-light tracking-[-0.03em] text-text-primary lowercase">
          connect bosta
        </h2>
        <p className="text-[0.78rem] text-text-secondary leading-[1.6] mt-2 max-w-[440px] mx-auto">
          Ivy reads your Bosta deliveries to know what actually got delivered vs returned. That&apos;s
          your real revenue — before that, it&apos;s just orders on a screen.
        </p>
      </div>

      <div
        className={`relative overflow-hidden rounded-[18px] border p-6 transition-colors duration-300 ${
          connected ? 'border-ivy-accent-border ivy-link-success text-center' : 'border-border'
        } bg-background`}
      >
        {connected ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <span className="w-[52px] h-[52px] rounded-full border border-ivy-accent-border bg-ivy-accent/10 flex items-center justify-center text-ivy-accent">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <div className="text-[0.95rem] text-text-primary">Connected</div>
            <div className="text-[0.72rem] text-text-secondary">
              Ivy is pulling the last 90 days in the background.
            </div>
          </div>
        ) : (
          <BostaKeyForm onSuccess={() => setConnected(true)} />
        )}
      </div>

      {!connected && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onBack}
            className="text-[0.74rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
          >
            Back
          </button>
          <button
            onClick={onSkip}
            className="text-[0.74rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
          >
            I&apos;ll do this later
          </button>
        </div>
      )}
    </div>
  );
}
