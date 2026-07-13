import type { Metadata } from 'next';
import { AGENTS, STATUS_LABELS } from '@/lib/agents';
import AgentCard from '@/components/agents/AgentCard';
import AgentMascot from '@/components/agents/AgentMascot';
import AgentStatusBadge from '@/components/agents/AgentStatusBadge';

export const metadata: Metadata = {
  title: 'Krew — agent registry test page',
  robots: { index: false, follow: false },
};

// Internal QA page (Session 1 definition of done): every card, badge, and
// mascot rendered straight from lib/agents.ts. Not linked from anywhere.
export default function DevAgentsPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-[1080px] mx-auto flex flex-col gap-20">

        <header>
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-[rgba(255,255,255,0.4)] mb-3">
            /dev/agents — internal
          </div>
          <h1 className="text-[1.6rem] font-light tracking-[-0.02em] text-[rgba(255,255,255,0.95)]">
            Everything below renders from the registry.
          </h1>
        </header>

        {/* Cards — the Phase 2 lineup building block */}
        <section>
          <SectionLabel>AgentCard</SectionLabel>
          <div className="grid gap-6 md:grid-cols-3">
            {AGENTS.map((agent) => (
              <AgentCard key={agent.slug} agent={agent} className="min-h-[520px]" />
            ))}
          </div>
        </section>

        {/* Mascots — idle float / glow breathing / blink, per size */}
        <section>
          <SectionLabel>AgentMascot — animated (72 / 120 / 200)</SectionLabel>
          <div className="flex flex-wrap items-end gap-12">
            {AGENTS.map((agent) => (
              <div key={agent.slug} className="flex items-end gap-6">
                <AgentMascot agent={agent} size={72} />
                <AgentMascot agent={agent} size={120} />
                <AgentMascot agent={agent} size={200} />
              </div>
            ))}
          </div>
          <SectionLabel className="mt-10">AgentMascot — animated=false</SectionLabel>
          <div className="flex flex-wrap items-end gap-8">
            {AGENTS.map((agent) => (
              <AgentMascot key={agent.slug} agent={agent} size={96} animated={false} />
            ))}
          </div>
        </section>

        {/* Badges — all statuses, driven by STATUS_LABELS */}
        <section>
          <SectionLabel>AgentStatusBadge — {Object.values(STATUS_LABELS).join(' / ')}</SectionLabel>
          <div className="flex flex-wrap items-center gap-8">
            {AGENTS.map((agent) => (
              <div key={agent.slug} className="flex items-center gap-3">
                <span className="text-[0.78rem] text-[rgba(255,255,255,0.65)]">{agent.name}</span>
                <AgentStatusBadge agent={agent} />
              </div>
            ))}
          </div>
        </section>

        {/* Theme scope — any element under [data-agent] inherits the accent */}
        <section>
          <SectionLabel>[data-agent] theme scope</SectionLabel>
          <div className="grid gap-4 md:grid-cols-3">
            {AGENTS.map((agent) => (
              <div
                key={agent.slug}
                data-agent={agent.slug}
                className="rounded-[14px] border p-6"
                style={{
                  borderColor: 'rgba(255,255,255,0.07)',
                  background: 'var(--agent-accent-soft)',
                }}
              >
                <div className="text-[0.72rem] mb-2" style={{ color: 'var(--agent-accent)' }}>
                  var(--agent-accent) · {agent.name}
                </div>
                <div className="text-[0.68rem] text-[rgba(255,255,255,0.65)] font-light leading-[1.6]">
                  {agent.tagline}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.4)] mb-5 ${className ?? ''}`}>
      {children}
    </div>
  );
}
