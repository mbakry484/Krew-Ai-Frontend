'use client';

import { getLiveAgent, getBetaAgent } from '@/lib/agents';
import { CLOSING_CTA } from '@/content/landing-copy';
import Button from '@/components/Button';

// =============================================================================
// CLOSING CTA (Phase 2.6) — the finale. Headline and CTA labels interpolate the
// live and beta agent names from the registry, so the ask rotates with launch
// state ("Start with <live>. Scale with your Krew." / "Request <beta> invite").
// Fixed copy fragments come from content/landing-copy.ts.
// =============================================================================

export default function ClosingCtaSection() {
  const live = getLiveAgent();
  const beta = getBetaAgent();

  return (
    <section className="text-center border-t border-b border-border py-40 px-8">
      <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">
        Early Access
      </div>
      <h2 className="text-[clamp(1.4rem,3.2vw,2.1rem)] font-light tracking-[-0.03em] leading-[1.2] mx-auto mb-[0.9rem] text-text-primary">
        Start with {live.name}.
        <br />
        {CLOSING_CTA.headlineTail}
      </h2>
      <p className="text-[0.8rem] text-text-secondary leading-[1.8] max-w-[460px] font-light mx-auto mb-8">
        {CLOSING_CTA.sub}
      </p>
      <div className="flex justify-center flex-wrap" style={{ gap: 'var(--btn-gap)' }}>
        <Button href="/auth/signup" variant="primary">
          Start with {live.name}
        </Button>
        {beta && (
          <Button href="/auth/signup" variant="secondary">
            Request {beta.name} invite
          </Button>
        )}
      </div>
    </section>
  );
}
