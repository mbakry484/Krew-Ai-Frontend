'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { CREW_THESIS } from '@/content/landing-copy';

// =============================================================================
// CREW THESIS (Phase 2.5) — the short manifesto beat: agents share context,
// one operation. Copy (which names the crew by design) comes from
// content/landing-copy.ts, so this component stays free of agent strings.
// Quiet scroll reveal per KREW-DESIGN §5.
// =============================================================================

export default function CrewThesisSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section
      ref={ref}
      data-in={inView || undefined}
      className="crew-thesis border-t border-border py-40 px-8 text-center"
    >
      <div className="max-w-[720px] mx-auto">
        <h2 className="text-[clamp(1.5rem,3.4vw,2.3rem)] font-light tracking-[-0.03em] leading-[1.2] text-text-primary mb-6">
          {CREW_THESIS.headline}
        </h2>
        <p className="text-[0.9rem] md:text-[1rem] text-text-secondary leading-[1.8] font-light max-w-[560px] mx-auto">
          {CREW_THESIS.body}
        </p>
      </div>

      <style jsx>{`
        .crew-thesis :global(h2),
        .crew-thesis :global(p) {
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .crew-thesis :global(p) {
          transition-delay: 0.1s;
        }
        .crew-thesis[data-in] :global(h2),
        .crew-thesis[data-in] :global(p) {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .crew-thesis :global(h2),
          .crew-thesis :global(p) {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
