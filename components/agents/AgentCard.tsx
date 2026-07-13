import Link from 'next/link';
import type { Agent } from '@/lib/agents';
import AgentMascot from './AgentMascot';
import AgentStatusBadge from './AgentStatusBadge';

/**
 * The agent lineup card (design-refs/MASCOTS.png): always-dark surface on
 * --bg-base, aura glow + grain behind the content, card copy up top, glowing
 * mascot centered, name + /role beneath, CTA at the foot. Everything on it —
 * strings, accent, status, route — comes from the registry entry.
 *
 * `soon` agents render dimmed and non-clickable (KREW-DESIGN §6 + Phase 0
 * decision 2); everything else links to the agent's page.
 */
export default function AgentCard({
  agent,
  className,
}: {
  agent: Agent;
  className?: string;
}) {
  const rootClass = className ? `agent-card ${className}` : 'agent-card';
  const clickable = agent.status !== 'soon';

  const inner = (
    <>
      {/* §3 v2 (a): the designed aura texture itself — grain baked in */}
      <div
        className="agent-card-aura"
        style={{ backgroundImage: `url(${agent.auraTexture})` }}
        aria-hidden="true"
      />
      <div className="agent-card-content">
        <div className="flex w-full items-start justify-between gap-4">
          <p className="agent-card-copy">{agent.oneLiner}</p>
          <AgentStatusBadge agent={agent} className="shrink-0" />
        </div>
        <AgentMascot agent={agent} size={150} className="my-auto py-10" />
        <div className="agent-card-name">{agent.name}</div>
        <div className="agent-card-role">/{agent.role}</div>
        <div className="agent-card-cta">{agent.cardCta}</div>
      </div>
    </>
  );

  if (!clickable) {
    return (
      <div className={rootClass} data-agent={agent.slug} data-status={agent.status}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={agent.href}
      className={rootClass}
      data-agent={agent.slug}
      data-status={agent.status}
    >
      {inner}
    </Link>
  );
}
