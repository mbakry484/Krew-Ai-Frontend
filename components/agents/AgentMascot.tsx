import type { CSSProperties } from 'react';
import type { Agent, AgentSlug } from '@/lib/agents';
import IvyMascot from './mascots/IvyMascot';
import LunaMascot from './mascots/LunaMascot';
import NovaMascot from './mascots/NovaMascot';

// Expressions come from Mascot Lab as extra face groups; only the idle pose is
// exported so far. The prop exists so call sites don't churn when they land.
export type MascotExpression = 'idle';

const MASCOT_BY_SLUG: Record<AgentSlug, typeof IvyMascot> = {
  ivy: IvyMascot,
  luna: LunaMascot,
  nova: NovaMascot,
};

/**
 * The one mascot component (KREW-DESIGN §4). Renders the agent's blob SVG
 * inside its own [data-agent] scope, so the gradient picks up the agent's
 * accent tokens anywhere it's dropped. Idle float, glow breathing, and blink
 * run by default via the .agent-mascot rules in globals.css, which also freeze
 * them under prefers-reduced-motion.
 *
 * Mascots live at product + brand/marketing level; never in the navbar.
 */
export default function AgentMascot({
  agent,
  size = 120,
  expression = 'idle',
  animated = true,
  className,
}: {
  agent: Agent;
  /** Rendered box in px (SVG canvas is uniform 520×520 across agents). */
  size?: number;
  expression?: MascotExpression;
  animated?: boolean;
  className?: string;
}) {
  const Blob = MASCOT_BY_SLUG[agent.slug];

  // Deterministic per-agent offsets (SSR-safe) so a lineup of mascots never
  // floats or blinks in lockstep. Blink period stays inside the §4 4–7s band.
  const seed =
    agent.slug.charCodeAt(0) * 7 + agent.slug.charCodeAt(agent.slug.length - 1);
  const style = {
    width: size,
    height: size,
    '--mascot-desync': `${(-(seed % 47) / 10).toFixed(1)}s`,
    '--mascot-blink-period': `${(4.2 + (seed % 26) / 10).toFixed(1)}s`,
  } as CSSProperties;

  return (
    <span
      className={className ? `agent-mascot ${className}` : 'agent-mascot'}
      data-agent={agent.slug}
      data-animated={animated || undefined}
      data-expression={expression}
      role="img"
      aria-label={`${agent.name} mascot`}
      style={style}
    >
      <Blob aria-hidden="true" focusable="false" />
    </span>
  );
}
