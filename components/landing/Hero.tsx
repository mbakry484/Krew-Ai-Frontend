'use client';

import { useEffect, useState } from 'react';
import { getLiveAgent } from '@/lib/agents';
import { getHeroCopy } from '@/content/agent-content';
import HeroStage from '@/components/landing/HeroStage';
import Button from '@/components/Button';

// =============================================================================
// LANDING HERO (Phase 2.1) — renders entirely from the registry's live agent
// and its content config. When the next agent launches, the hero rotates by
// flipping registry state, never by rewriting this file (KREW-RELAUNCH 2.1).
//
// Motion budget: the entrance is the quiet blur-in stagger inherited from the
// previous hero. The page's single hero-grade moment (KREW-DESIGN §5) is the
// crew assemble in CrewSection — nothing here competes with it.
// =============================================================================

export default function Hero() {
  const agent = getLiveAgent();
  const copy = getHeroCopy(agent.slug);

  // Keep elements at opacity:0 until after first paint, then apply the
  // animation class. Double RAF guarantees the browser has committed the
  // opacity:0 state before the animation starts — no flash. (Same pattern
  // as the previous hero.)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  const scrollToCrew = () => {
    const el = document.querySelector('#crew');
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const at = (delayMs: number) => ({
    opacity: ready ? undefined : 0,
    animationDelay: `${delayMs}ms`,
  });

  // Typography, not copy: glue money figures ("EGP 914,000.") to a single
  // unbreakable unit so headlines never wrap mid-figure. Config strings stay
  // byte-identical to COPY.md.
  const nbspMoney = (s: string) => s.replace(/EGP (?=\d)/g, 'EGP\u00A0');

  return (
    <div className="min-h-screen flex flex-col">
      {/* -mt-20/pt-20 pulls the aura up behind the floating navbar so there is
          no seam between the page top and the hero backdrop */}
      <div className="relative flex-1 flex -mt-20 pt-20" data-agent={agent.slug}>
        {/* §3 aura — dark theme only; hidden in light via .hero-aura rules */}
        <div className="krew-aura hero-aura" aria-hidden="true" />

        <div className="relative z-[1] grid hero-grid max-w-[1320px] mx-auto w-full px-12 gap-8 items-center min-h-[calc(100vh-48px-64px)]">

          {/* LEFT */}
          <div className="hero-left flex flex-col py-20 pr-8">
            <div
              className={`${ready ? 'hero-blur-in' : ''} text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[var(--space-hero-eyebrow)]`}
              style={at(0)}
            >
              Krew — {agent.role}
            </div>

            <h1
              className={`${ready ? 'hero-blur-in' : ''} hero-headline mb-[var(--space-hero-headline)]`}
              style={at(80)}
            >
              <span className="font-light text-text-secondary">{nbspMoney(copy.headline)}</span>
              <br />
              <span className="font-normal text-text-primary">{nbspMoney(copy.headlineEmphasis)}</span>
            </h1>

            <p
              className={`${ready ? 'hero-blur-in' : ''} text-[0.8rem] text-text-secondary max-w-[420px] leading-[1.6] font-light mb-[var(--space-hero-subhead)]`}
              style={at(160)}
            >
              {copy.sub}
            </p>

            <div className={`${ready ? 'hero-blur-in' : ''} hero-cta-row`} style={at(240)}>
              <Button href="/early-access" variant="primary">
                Start with {agent.name}
              </Button>
              <Button variant="secondary" onClick={scrollToCrew}>
                Meet the crew →
              </Button>
            </div>

            <div
              className={`${ready ? 'hero-blur-in' : ''} text-[0.72rem] text-text-tertiary font-light mt-7`}
              style={at(320)}
            >
              {copy.crewSignal}
            </div>
          </div>

          {/* RIGHT — the stage: the live agent at work (Telegram thread
              driving the dashboard mock; mascot lives in the chat header) */}
          <div
            className={`hero-right ${ready ? 'hero-blur-in-slow' : ''} flex items-center justify-center py-6`}
            style={at(100)}
          >
            <div className="relative w-full flex items-center justify-center">
              {/* light-theme agent presence (KREW-DESIGN §3 light rule) */}
              <div className="hero-mascot-glow" aria-hidden="true" />
              <div className="relative z-[1] w-full">
                <HeroStage agent={agent} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip — agent-agnostic claims; flagged for the 2.6 cleanup pass */}
      <div className="flex justify-center border-t border-border relative z-[1]">
        <div className="stats-strip-grid">
          {[
            { num: '~0s', label: 'Response time' },
            { num: '24/7', label: 'Coverage' },
            { num: '100%', label: 'Consistency' },
            { num: '∞', label: 'Scale' },
          ].map((s, i) => (
            <div key={s.label} className={`text-center px-9 py-8 ${i < 3 ? 'border-r border-border' : ''}`}>
              <div className="text-[1.2rem] font-light tracking-[-0.04em]">{s.num}</div>
              <div className="text-[0.63rem] text-text-tertiary tracking-[0.05em] uppercase mt-[2px]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .hero-grid {
          grid-template-columns: 52% 48%;
        }
        .hero-headline {
          font-size: clamp(2.6rem, 4.6vw, 4.3rem);
          letter-spacing: -0.03em;
          line-height: 1.02;
        }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; }
          .hero-right { padding: 0 0 2.5rem; }
        }
        /* ── Mobile hero: tighter statement type; the stage below restructures
              itself (strip + full-bleed chat) inside HeroStage ── */
        @media (max-width: 768px) {
          .hero-headline {
            font-size: 1.85rem;
            letter-spacing: -0.02em;
            line-height: 1.12;
          }
          .hero-left { padding: 2.5rem 0 1.6rem; }
        }
        @media (max-width: 640px) {
          .hero-grid { padding: 0 1.2rem; gap: 0; }
          .hero-right { padding: 0 0 2.5rem; }
        }

        .stats-strip-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 640px) {
          .stats-strip-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
