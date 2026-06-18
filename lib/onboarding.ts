// =============================================================================
// ONBOARDING COMPLETION — single source of truth (frontend, mocked)
// =============================================================================
// This is the ONE place onboarding completion is read from. Both the Customize
// page checklist ("X of 4 done" + progress bar) and the sidebar
// setup-incomplete dot import from here. Do NOT fork or duplicate this — if two
// signals disagree about setup status, that's a bug.
//
// TODO(backend): replace mock completion with real per-store setup status.
//   Each step's `completed` is hardcoded false for now. See the "Onboarding
//   Checklist" section of AGENT_NAME_INTEGRATION.md for the exact per-step
//   backend condition. This is display-only: no save logic, no real detection.
// =============================================================================

export type OnboardingStepKey = 'knowledge' | 'situations' | 'sizing' | 'voice';

export interface OnboardingStep {
  key: OnboardingStepKey;
  completed: boolean;
  /** Optional/PRO steps do not block "setup complete" (e.g. voice training). */
  optional?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { key: 'knowledge', completed: false },
  { key: 'situations', completed: false },
  { key: 'sizing', completed: false },
  { key: 'voice', completed: false, optional: true },
];

/** Count of required (non-optional) steps that are still incomplete. */
export function incompleteRequiredCount(steps: OnboardingStep[] = ONBOARDING_STEPS): number {
  return steps.filter((s) => !s.optional && !s.completed).length;
}

/**
 * True when every required step is done. The optional/PRO step (voice) does not
 * block completion. Used by the sidebar dot (hidden when complete) and any
 * future setup signal — all must read this one source.
 */
export function isSetupComplete(steps: OnboardingStep[] = ONBOARDING_STEPS): boolean {
  return incompleteRequiredCount(steps) === 0;
}
