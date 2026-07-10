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

// ─── Hero stage — scripted Telegram thread + dashboard mock ─────────────────
// Script strings verbatim from COPY.md "Hero stage — Telegram script".
// Dashboard chrome strings mirror the real agent dashboard UI (see the live
// /dashboard/ivy overview); numbers are the canonical COPY.md set — the two
// ticks land exactly on expenses EGP 30,000 / real net profit EGP 660,000.

export type StageChatItem =
  | { kind: 'photo' } // user sends a receipt photo attachment
  | { kind: 'agent'; text: string; chips?: [string, string] }
  | { kind: 'voice'; duration: string; transcript: string; rtl: true }
  | { kind: 'user'; text: string; rtl?: true }
  | { kind: 'analysis'; lines: string[] };

export interface StageScript {
  chat: StageChatItem[];
  dashboard: {
    title: string;
    subtitle: string;
    profitLabel: string;
    /** "net revenue EGP 690,000 − expenses EGP X" — X ticks live. */
    netRevenue: number;
    profitStart: number;
    expensesStart: number;
    ticks: { amount: number; label: string }[];
    returnRate: { label: string; stat: string; line: string };
    loggedTitle: string;
    loggedEmpty: string;
  };
}

const STAGE_SCRIPT: Partial<Record<AgentSlug, StageScript>> = {
  ivy: {
    chat: [
      { kind: 'photo' },
      {
        kind: 'agent',
        text: '📄 Got it — Shipping supplies, EGP 1,850. Which pool?',
        chips: ['🟢 Operations', '🔵 Marketing'],
      },
      { kind: 'agent', text: 'Logged ✓ Shipping supplies — EGP 1,850 · Operations pool' },
      { kind: 'voice', duration: '0:04', transcript: 'دفعت ٣٢٠٠ جنيه تغليف', rtl: true },
      { kind: 'agent', text: 'Logged ✓ Packaging — EGP 3,200 🧾' },
      { kind: 'user', text: 'إزاي نوصل مليون جنيه الشهر ده؟', rtl: true },
      {
        kind: 'analysis',
        lines: [
          "📊 You're at EGP 690,000 net — EGP 310,000 to go.",
          '🔻 Returns are 28% (EGP 224,000). Getting to 20% recovers ≈ EGP 73,000.',
          '📦 Top sellers cover 70% of the gap — restock this week.',
          '🎯 Doable. 9 days left.',
        ],
      },
    ],
    dashboard: {
      title: 'financial overview',
      subtitle: 'real profit, cash, and return visibility',
      profitLabel: 'Real net profit — this month',
      netRevenue: 690000,
      // canon minus the two logged amounts, so the loop ENDS on canon
      profitStart: 665050,
      expensesStart: 24950,
      ticks: [
        { amount: 1850, label: 'Shipping supplies · Operations' },
        { amount: 3200, label: 'Packaging' },
      ],
      returnRate: {
        label: 'Return rate',
        stat: '28.0%',
        line: "EGP 224,000 came back as COD returns Shopify can't see.",
      },
      loggedTitle: 'What Ivy logged',
      loggedEmpty: 'nothing logged yet',
    },
  },
};

export function getStageScript(slug: AgentSlug): StageScript {
  const script = STAGE_SCRIPT[slug];
  if (!script) {
    throw new Error(
      `No stage script for live agent "${slug}" — add its approved COPY.md block to content/agent-content.ts`
    );
  }
  return script;
}
