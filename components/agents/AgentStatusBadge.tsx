import { STATUS_LABELS, type Agent } from '@/lib/agents';

/**
 * Launch-state badge, driven entirely by the registry (KREW-DESIGN §6):
 * live = accent dot with a slow pulse, beta = accent outline chip,
 * soon = dimmed label. Carries its own [data-agent] scope so it works
 * standalone; styling lives in the .agent-status rules in globals.css.
 */
export default function AgentStatusBadge({
  agent,
  className,
}: {
  agent: Agent;
  className?: string;
}) {
  return (
    <span
      className={className ? `agent-status ${className}` : 'agent-status'}
      data-agent={agent.slug}
      data-status={agent.status}
    >
      {agent.status === 'live' && <span className="agent-status-dot" />}
      {STATUS_LABELS[agent.status]}
    </span>
  );
}
