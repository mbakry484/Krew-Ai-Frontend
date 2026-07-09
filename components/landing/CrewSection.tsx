'use client';

import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { useInView } from 'motion/react';
import { AGENTS } from '@/lib/agents';
import AgentCard from '@/components/agents/AgentCard';

// =============================================================================
// CREW REVEAL (Phase 2.2) — the permanent brand layer directly under the
// rotating hero. Strings verbatim from content/COPY.md "Crew reveal"; the
// three cards render straight from the registry (Ivy LIVE → link, Luna BETA →
// link, Nova SOON → dimmed, all handled inside AgentCard).
//
// The assemble is this page's single hero-grade animated moment (KREW-DESIGN
// §5): the cards fade in stacked on the center slot, hold a beat, then the
// outer two glide out to formation on the §5 slow-heavy curve. Mobile
// (stacked layout) degrades to quiet staggered reveals; prefers-reduced-motion
// drops all movement and keeps a plain fade. Choreography is pure CSS below —
// useInView only flips the [data-assembled] switch, once.
// =============================================================================

export default function CrewSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      id="crew"
      ref={ref}
      data-assembled={inView || undefined}
      className="crew-section border-t border-border py-40 px-8"
    >
      <div className="max-w-[1080px] mx-auto">
        <div className="crew-header text-center">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">
            The Crew
          </div>
          <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] mb-[0.9rem] text-text-primary">
            Not another tool. A crew.
          </h2>
          <p className="text-[0.8rem] text-text-secondary leading-[1.8] max-w-[420px] font-light mx-auto">
            Agents that run your brand&apos;s operations — each one owns a job, all of them share context.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {AGENTS.map((agent, i) => (
            <div
              key={agent.slug}
              className="crew-card"
              style={
                {
                  // desktop formation: outer cards start on the center slot
                  '--assemble-x': `${(1 - i) * 107}%`,
                  '--glide-delay': `${i * 0.1}s`,
                  // mobile: plain staggered reveal
                  '--m-delay': `${i * 0.12}s`,
                } as CSSProperties
              }
            >
              <AgentCard agent={agent} className="h-full min-h-[500px]" />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .crew-header {
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .crew-section[data-assembled] .crew-header {
          opacity: 1;
          transform: none;
        }

        .crew-card {
          position: relative;
          opacity: 0;
          transform: translateX(var(--assemble-x));
          /* stack fades in together at 0.25s; glide starts after a held beat */
          transition:
            opacity 0.45s ease 0.25s,
            transform 0.85s cubic-bezier(0.22, 1, 0.36, 1) calc(0.95s + var(--glide-delay));
        }
        /* center card reads as the top of the stack during formation */
        .crew-card:nth-child(2) { z-index: 3; }
        .crew-card:nth-child(1) { z-index: 2; }

        .crew-section[data-assembled] .crew-card {
          opacity: 1;
          transform: none;
        }

        /* Mobile — cards stack vertically; assemble becomes a quiet §5 reveal
           (opacity + ≤24px translate, staggered) */
        @media (max-width: 767px) {
          .crew-card {
            transform: translateY(20px);
            transition:
              opacity 0.6s ease var(--m-delay),
              transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) var(--m-delay);
          }
        }

        /* Reduced motion — no movement at all, plain fade */
        @media (prefers-reduced-motion: reduce) {
          .crew-header,
          .crew-card {
            transform: none !important;
            transition: opacity 0.4s ease !important;
          }
        }
      `}</style>
    </section>
  );
}
