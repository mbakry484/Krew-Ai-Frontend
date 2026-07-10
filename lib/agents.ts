// =============================================================================
// AGENT REGISTRY — the single source of truth for agent identity.
// =============================================================================
// Every agent name, role, status, accent, tagline, route, and card string the
// marketing site renders comes from here. Nothing agent-specific may be
// hardcoded in a page or component (CLAUDE.md rule 2).
//
// Sources — do not edit values without updating the source docs first:
//   - strings: content/COPY.md (rule 3: no invented copy)
//   - colors:  KREW-DESIGN.md §2 (rule 4: no invented colors); the CSS
//     counterparts live in the [data-agent] scopes in app/globals.css
//
// This module is data-only (fully serializable) so server components, metadata
// and future OG generation can import it. Mascot SVGs are resolved from `slug`
// by <AgentMascot /> (components/agents/AgentMascot.tsx).
// =============================================================================

export type AgentSlug = 'ivy' | 'luna' | 'nova';
export type AgentStatus = 'live' | 'beta' | 'soon';

/** Badge text per status — KREW-DESIGN.md §6 / content/COPY.md "STATUS BADGES". */
export const STATUS_LABELS: Record<AgentStatus, string> = {
  live: 'LIVE',
  beta: 'BETA — INVITE ONLY',
  soon: 'SOON',
};

/** KREW-DESIGN.md §2 — one accent per agent, never two in one component. */
export interface AgentAccent {
  /** `accent` — primary accent */
  base: string;
  /** `accent-soft` — 15% alpha fills */
  soft: string;
  /** `aura-core` — primary aura glow hue */
  auraCore: string;
  /** `aura-bleed` — secondary corner hue, barely visible */
  auraBleed: string;
}

export interface Agent {
  slug: AgentSlug;
  name: string;
  /** Rendered as `/Role` on cards (design-refs/MASCOTS.png). */
  role: string;
  status: AgentStatus;
  accent: AgentAccent;
  /** Agent-page hero headline (COPY.md "AGENT PAGES"). */
  tagline: string;
  /** Card copy (COPY.md "Agent cards"). */
  oneLiner: string;
  /** Card CTA label (COPY.md "Agent cards"). */
  cardCta: string;
  /** Route — /agents/ivy and /agents/nova ship in Phase 3 (404 until then). */
  href: string;
  channels: string[];
  /** SVG path (24×24 stroke icon) for the nav mega-menu tile. */
  menuIconPath: string;
  /**
   * KREW-DESIGN §3 v2 implementation (a): the designed aura as a texture
   * asset (WebP of design-refs/aura-*.png) — card backgrounds use this,
   * never a generated gradient.
   */
  auraTexture: string;
}

/** Ordered for display: live agent leads the lineup. */
export const AGENTS: readonly Agent[] = [
  {
    slug: 'ivy',
    name: 'Ivy',
    role: 'Financial Visibility',
    status: 'live',
    accent: {
      base: '#1FCFA4',
      soft: 'rgba(31,207,164,0.15)',
      auraCore: '#5FCDB2',
      auraBleed: '#1E5F8A',
    },
    tagline: 'Your real profit. Finally visible.',
    oneLiner:
      'Tracks expenses, cash flow, and profitability in real time. Surfaces financial signals so you always know where your money stands.',
    cardCta: 'Open Ivy →',
    href: '/agents/ivy',
    channels: ['Telegram', 'Bosta', 'Shopify'],
    menuIconPath:
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    auraTexture: '/textures/aura-ivy.webp',
  },
  {
    slug: 'luna',
    name: 'Luna',
    role: 'Customer Operations',
    status: 'beta',
    accent: {
      base: '#FF3D9E',
      soft: 'rgba(255,61,158,0.15)',
      auraCore: '#E86FAE',
      auraBleed: '#C2402A',
    },
    tagline: 'Every DM, answered. While you sleep.',
    oneLiner:
      'Handles Instagram and WhatsApp DMs with your brand voice, processes orders, and escalates complex issues.',
    cardCta: 'Request invite →',
    href: '/agents/luna',
    channels: ['Instagram', 'WhatsApp', 'Shopify'],
    menuIconPath:
      'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
    auraTexture: '/textures/aura-luna.webp',
  },
  {
    slug: 'nova',
    name: 'Nova',
    role: 'Marketing Intelligence',
    status: 'soon',
    accent: {
      base: '#7C5CFF',
      soft: 'rgba(124,92,255,0.15)',
      auraCore: '#7FA3D9',
      auraBleed: '#3B2FBF',
    },
    tagline: 'Nova is coming.',
    oneLiner:
      'Connects ad spend, content performance, and conversion data into one clear intelligence layer.',
    cardCta: 'Get notified',
    href: '/agents/nova',
    channels: [],
    menuIconPath: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6M23 6v6',
    auraTexture: '/textures/aura-nova.webp',
  },
];

export function getAgent(slug: AgentSlug): Agent {
  const agent = AGENTS.find((a) => a.slug === slug);
  if (!agent) throw new Error(`Unknown agent slug: ${slug}`);
  return agent;
}

/**
 * The current spotlight agent. Phase 2's hero renders from this — launches
 * rotate by flipping registry state, never by rewriting pages.
 */
export function getLiveAgent(): Agent {
  return AGENTS.find((a) => a.status === 'live') ?? AGENTS[0];
}
