'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { getBetaAgent } from '@/lib/agents';
import { getBetaCopy } from '@/content/agent-content';
import AgentMascot from '@/components/agents/AgentMascot';
import AgentStatusBadge from '@/components/agents/AgentStatusBadge';
import Button from '@/components/Button';

// =============================================================================
// BETA SECTION (Phase 2.4) — a deliberate pattern-break from the centred
// live-agent beats above: a full-width, bold dark card with the agent's aura,
// so the shift to a new agent reads instantly. Asymmetric — copy left, the
// mascot right, surrounded by the multilingual overnight-inbox DMs that
// blur-fade in and settle as "answered". Renders from the registry's beta
// agent; when there is none, it renders nothing.
// =============================================================================

// A handful of the overnight inbox, scattered around the mascot. `answered`
// cards show the green tick; the rest are still-incoming.
const DMS = [
  { handle: 'zaynab.nour', msg: 'هي عندكم المقاس الـ L؟', pos: { top: '4%', left: '0%' }, answered: true, delay: 0.15 },
  { handle: 'omar.saleh', msg: 'delivery to Cairo?', pos: { top: '-2%', right: '8%' }, answered: false, delay: 0.32, hideSm: true },
  { handle: 'lina.maged', msg: '3andoko el black hoodie?', pos: { top: '40%', left: '-6%' }, answered: true, delay: 0.24, hideSm: true },
  { handle: 'sara.rami', msg: "return policy?", pos: { bottom: '6%', left: '6%' }, answered: false, delay: 0.42 },
  { handle: 'yasmin.k', msg: 'ممكن أغير المقاس؟', pos: { bottom: '0%', right: '2%' }, answered: true, delay: 0.2 },
  { handle: 'farah.adel', msg: 'ship to Alex?', pos: { top: '28%', right: '-4%' }, answered: false, delay: 0.36 },
];

export default function BetaAgentSection() {
  const agent = getBetaAgent();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  if (!agent) return null;

  const copy = getBetaCopy(agent.slug);
  const [headLead, headTail] = copy.headline.split(/(?<=\.)\s+/);

  return (
    <section ref={ref} data-agent={agent.slug} data-in={inView || undefined} className="beta px-6 py-24 md:py-28">
      <div className="beta-card">
        {/* the bold dark backdrop — the agent's aura (grain + glow) */}
        <div className="krew-aura" aria-hidden="true" />

        <div className="beta-grid">
          {/* LEFT — copy */}
          <div className="beta-copy">
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <span className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary">
                {agent.name} — {agent.role}
              </span>
              <AgentStatusBadge agent={agent} />
            </div>
            <h2 className="text-[clamp(1.6rem,3.4vw,2.5rem)] font-light tracking-[-0.03em] leading-[1.12] text-text-primary mb-5">
              {headLead}
              {headTail && (
                <>
                  <br />
                  <span className="text-text-secondary">{headTail}</span>
                </>
              )}
            </h2>
            <p className="text-[0.85rem] text-text-secondary leading-[1.8] font-light max-w-[420px] mb-9">
              {copy.sub}
            </p>
            <Button href="/early-access" variant="primary">
              {copy.cta}
            </Button>
          </div>

          {/* RIGHT — the mascot, ringed by the overnight inbox */}
          <div className="beta-stage" aria-hidden="true">
            <div className="beta-mascot-glow" />
            <div className="beta-mascot">
              <AgentMascot agent={agent} size={200} />
            </div>

            {DMS.map((d) => (
              <div
                key={d.handle}
                className={`beta-dm ${d.hideSm ? 'beta-dm-hide-sm' : ''}`}
                style={{ ...d.pos, ['--dm-delay' as string]: `${d.delay}s` }}
              >
                <div className="beta-dm-avatar">{d.handle.slice(0, 2).toUpperCase()}</div>
                <div className="beta-dm-body">
                  <div className="beta-dm-handle">{d.handle}</div>
                  <div className="beta-dm-msg" dir="auto">{d.msg}</div>
                </div>
                {d.answered ? (
                  <span className="beta-dm-tick">✓</span>
                ) : (
                  <span className="beta-dm-now">now</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .beta-card {
          position: relative;
          max-width: 1240px;
          margin: 0 auto;
          border-radius: 28px;
          border: 1px solid var(--border-md);
          overflow: hidden;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.28);
        }
        .beta-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 44% 56%;
          align-items: center;
          gap: 2rem;
          padding: clamp(2.2rem, 4vw, 4rem);
          min-height: 460px;
        }
        .beta-copy {
          opacity: 0;
          transform: translateY(18px);
          transition:
            opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .beta[data-in] .beta-copy {
          opacity: 1;
          transform: none;
        }

        /* stage — mascot centred, DMs positioned around it */
        .beta-stage {
          position: relative;
          min-height: 380px;
          align-self: stretch;
        }
        .beta-mascot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
        }
        .beta-mascot-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 320px;
          height: 320px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, var(--agent-accent-soft), transparent 68%);
          pointer-events: none;
        }
        .beta-dm {
          position: absolute;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 190px;
          max-width: 62%;
          padding: 0.5rem 0.6rem;
          border-radius: 12px;
          background: var(--bg2);
          border: 1px solid var(--border);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.3);
          opacity: 0;
          transform: translateY(8px) scale(0.94);
          filter: blur(8px);
          transition:
            opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) var(--dm-delay),
            transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) var(--dm-delay),
            filter 0.7s cubic-bezier(0.22, 1, 0.36, 1) var(--dm-delay);
        }
        .beta[data-in] .beta-dm {
          opacity: 1;
          transform: none;
          filter: blur(0);
        }
        .beta-dm-avatar {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.5rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .beta-dm-body {
          flex: 1;
          min-width: 0;
        }
        .beta-dm-handle {
          font-size: 0.6rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .beta-dm-msg {
          font-size: 0.6rem;
          color: var(--text-secondary);
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .beta-dm-tick {
          flex-shrink: 0;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #3dbb77;
          color: #fff;
          font-size: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .beta-dm-now {
          flex-shrink: 0;
          font-size: 0.5rem;
          color: var(--text-tertiary);
        }

        @media (max-width: 860px) {
          .beta-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
            text-align: left;
          }
          .beta-copy {
            text-align: center;
          }
          .beta-copy :global(.flex) {
            justify-content: center;
          }
          .beta-copy p {
            margin-left: auto;
            margin-right: auto;
          }
          .beta-stage {
            min-height: 340px;
            margin-top: 1rem;
          }
          .beta-dm-hide-sm {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .beta-copy,
          .beta-dm {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
