// =============================================================================
// PER-AGENT MARKETING CONTENT — the registry's companion (KREW-RELAUNCH Phase 1
// "per-agent content configs"). Along with lib/agents.ts and content/COPY.md,
// this is a sanctioned home for agent-named strings; pages and components must
// import from here, never inline agent copy.
//
// Every string is verbatim from content/COPY.md — if a string you need is
// missing there, STOP and ask; never draft placeholder marketing copy.
// =============================================================================

import type { AgentSlug } from '@/lib/agents';

export interface AgentHeroCopy {
  /** Headline line 1 (COPY.md HOMEPAGE › Hero). */
  headline: string;
  /** Headline line 2 — the emphasis line. */
  headlineEmphasis: string;
  sub: string;
  /** The quiet crew-signal line under the CTAs. */
  crewSignal: string;
}

// Only agents that can hold the hero (status: live) need an entry. When the
// hero rotates to a newly-live agent, add its approved COPY.md block here.
const HERO_COPY: Partial<Record<AgentSlug, AgentHeroCopy>> = {
  ivy: {
    headline: 'Shopify says EGP 914,000.',
    headlineEmphasis: 'Your real profit is EGP 660,000.',
    sub: "Ivy tracks what Shopify can't see — COD returns, real expenses, actual cash. On Telegram, in Arabic, automatically.",
    crewSignal: 'Ivy is the first of your Krew.',
  },
};

export function getHeroCopy(slug: AgentSlug): AgentHeroCopy {
  const copy = HERO_COPY[slug];
  if (!copy) {
    throw new Error(
      `No hero copy for live agent "${slug}" — add its approved COPY.md block to content/agent-content.ts`
    );
  }
  return copy;
}
