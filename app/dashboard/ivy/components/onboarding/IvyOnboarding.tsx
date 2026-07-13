'use client';

import { useEffect } from 'react';
import AgentMascot from '@/components/agents/AgentMascot';
import { AuraField } from '@/components/AuraSystem';
import { formatEGP } from '@/components/DashboardPrimitives';
import { useIvy } from '@/components/IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';
import { getAgent } from '@/lib/agents';
import { ONBOARDING_STEP_ORDER, OnboardingStep } from '@/lib/ivy/types';
import OnboardingPools from './OnboardingPools';
import OnboardingTelegram from './OnboardingTelegram';

// TASK 1 — First-open onboarding. A full-screen cinematic sequence that gates
// everything a brand-new user sees (onboarding.completed === false). Progress
// persists per step (localStorage, via ivyClient) so a refresh resumes rather
// than restarts. Pools are mandatory; skipping is allowed from step 3 onward.

const IVY = getAgent('ivy');
const IVY_HUE = 152; // Ivy's identity hue, matching the dashboard AuraField calls.

// Ivy's voice — one line per step, kept inline like every other Ivy page.
const WELCOME_LINE = "let's get your money visible.";

/** Small progress rail — three setup beats; "done" is the summary. */
function ProgressRail({ step }: { step: OnboardingStep }) {
  const beats: OnboardingStep[] = ['welcome', 'pools', 'telegram'];
  const idx = ONBOARDING_STEP_ORDER.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      {beats.map((b) => {
        const done = ONBOARDING_STEP_ORDER.indexOf(b) < idx;
        const active = b === step;
        return (
          <span
            key={b}
            className={`h-[3px] rounded-full transition-all duration-300 ${
              active ? 'w-6 bg-ivy-accent' : done ? 'w-3 bg-ivy-accent/60' : 'w-3 bg-border-md'
            }`}
          />
        );
      })}
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-2">
      <AgentMascot agent={IVY} size={116} />
      <h2 className="text-[1.7rem] max-md:text-[1.4rem] font-light tracking-[-0.035em] text-text-primary lowercase">
        {WELCOME_LINE}
      </h2>
      <p className="text-[0.82rem] text-text-secondary max-w-[380px] leading-[1.6]">
        Ivy turns the money moving through your brand into one honest picture — real profit, cash,
        and returns. Two quick steps and you&apos;re set.
      </p>
      <button
        onClick={onNext}
        className="rounded-full bg-btn-bg text-btn-text px-9 py-[11px] text-[0.82rem] font-medium hover:opacity-90 transition-opacity duration-150"
      >
        Start
      </button>
    </div>
  );
}

function StepDone({ onBack, onFinish }: { onBack: () => void; onFinish: () => void }) {
  const { capitals, onboarding } = useIvy();
  const totalBalance = capitals.reduce((s, c) => s + c.current_balance, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center flex flex-col items-center gap-3">
        <AgentMascot agent={IVY} size={92} />
        <h2 className="text-[1.5rem] font-light tracking-[-0.03em] text-text-primary lowercase">
          you&apos;re set
        </h2>
        <p className="text-[0.78rem] text-text-secondary max-w-[400px] leading-[1.6]">
          Here&apos;s where you&apos;re starting from. Log an expense any time and Ivy keeps the picture honest.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between bg-background2 border border-border rounded-[10px] px-4 py-3">
          <div>
            <div className="text-[0.78rem] text-text-primary">
              {capitals.length} capital pool{capitals.length !== 1 ? 's' : ''}
            </div>
            <div className="text-[0.66rem] text-text-tertiary">
              {formatEGP(totalBalance)} tracked from day one
            </div>
          </div>
          <span className="text-ivy-accent">
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </span>
        </div>

        <div className="flex items-center justify-between bg-background2 border border-border rounded-[10px] px-4 py-3">
          <div>
            <div className="text-[0.78rem] text-text-primary">Telegram</div>
            <div className="text-[0.66rem] text-text-tertiary">
              {onboarding.telegramLinked
                ? 'Connected — log expenses from your chat with Ivy.'
                : "Not linked yet — we'll remind you on the overview."}
            </div>
          </div>
          <span className={onboarding.telegramLinked ? 'text-ivy-accent' : 'text-text-tertiary'}>
            {onboarding.telegramLinked ? (
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            ) : (
              <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="text-[0.74rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
        >
          Back
        </button>
        <button
          onClick={onFinish}
          className="rounded-[10px] bg-btn-bg text-btn-text px-6 py-[9px] text-[0.78rem] font-medium hover:opacity-90 transition-opacity duration-150"
        >
          Open my dashboard
        </button>
      </div>
    </div>
  );
}

export default function IvyOnboarding() {
  const { onboarding } = useIvy();
  const { hydrated, completed, step } = onboarding;
  const open = hydrated && !completed;

  // Lock body scroll while the cinematic overlay is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Dev helper: window.__ivyReplayOnboarding() replays the flow.
  useEffect(() => {
    (window as unknown as { __ivyReplayOnboarding?: () => void }).__ivyReplayOnboarding = () =>
      ivyClient.resetOnboarding();
  }, []);

  if (!open) return null;

  const go = (s: OnboardingStep) => ivyClient.setOnboardingStep(s);

  return (
    <div
      className="ivy-onboard-backdrop fixed inset-0 z-[500] bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Set up Ivy"
    >
      <div className="relative w-full max-w-[560px] my-auto">
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-background2">
          <AuraField hue={IVY_HUE} sat={55} anchor={210} intensity={0.7} />
          <div className="relative z-[1] p-8 max-md:p-6">
            <ProgressRail step={step} />
            <div key={step} className="ivy-onboard-step mt-7">
              {step === 'welcome' && <StepWelcome onNext={() => go('pools')} />}
              {step === 'pools' && (
                <OnboardingPools onNext={() => go('telegram')} onBack={() => go('welcome')} />
              )}
              {step === 'telegram' && (
                <OnboardingTelegram
                  onNext={() => go('done')}
                  onBack={() => go('pools')}
                  onSkip={() => go('done')}
                />
              )}
              {step === 'done' && (
                <StepDone onBack={() => go('telegram')} onFinish={() => ivyClient.completeOnboarding()} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
