'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { getLiveAgent } from '@/lib/agents';
import { getHeroCopy } from '@/content/agent-content';
import Button from '@/components/Button';

// =============================================================================
// LANDING HERO (Phase 2.1) — character-first: the live agent's creature film
// fills the right of the frame, bleeding off the edge, its bottom dissolving
// into the page. Copy on the left. Renders from the registry's live agent, so
// the hero rotates by flipping registry state, never by rewriting this file.
//
// BACKGROUND REMOVAL: the source is a creature on a black void. mix-blend-mode
// LIGHTEN removes it — each pixel becomes max(video, page), so anywhere the
// video is darker than the page (the whole void, plus its H.264 compression
// noise) is simply replaced by page-black and vanishes; only the brighter
// creature + its glow survive. This beats `screen`, which LIFTS every dark
// value and so raised the void's noise into a visible box. Lighten leans on the
// page being dark — fine here, since marketing is dark-only (locked decision).
// Verified against a real compressed frame: no box, and more vibrant than an
// alpha luma-key (which dims the glass interior). One GPU-composited line.
// =============================================================================

// ── TUNING — the creature's size / position / fade ──
const VIDEO_WIDTH = '240%';       // ◀ SIZE knob: dramatically bigger — bleeds hard off the right/bottom
const VIDEO_SHIFT = '35%';        // horizontal position: bigger % = pushed further right
const VIDEO_DROP = '7%';          // vertical position: bigger % = pushed further down (bleeds off bottom)
const FADE_START = '74%';         // where the bottom dissolve begins
const FADE_END = '99%';           // where the bottom is fully gone

export default function Hero() {
  const agent = getLiveAgent();
  const copy = getHeroCopy(agent.slug);
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  // Reduced motion → hold on the poster frame instead of looping.
  useEffect(() => {
    if (reduce) videoRef.current?.pause();
  }, [reduce]);

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
  const nbspMoney = (s: string) => s.replace(/EGP (?=\d)/g, 'EGP ');

  return (
    // The creature lives on a dark void, so the hero is a dark band in BOTH
    // themes — data-theme="dark" re-scopes the design tokens for this subtree
    // (light text, #0A0A0A bg) so the video blends seamlessly on every edge.
    <div className="hero-root min-h-screen flex flex-col" data-theme="dark">
      <div className="relative flex-1 flex -mt-20 pt-20" data-agent={agent.slug}>

        <div className="relative z-[1] grid hero-grid max-w-[1320px] mx-auto w-full px-12 gap-8 items-center min-h-[calc(100vh-48px-64px)]">

          {/* LEFT — copy */}
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

          {/* RIGHT — the creature film */}
          <div
            className={`hero-right ${ready ? 'hero-blur-in-slow' : ''}`}
            style={at(100)}
            aria-hidden="true"
          >
            <div className="hero-video-wrap">
              <video
                ref={videoRef}
                className="hero-video"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster="/hero/ivy-hero-poster.webp"
              >
                <source src="/hero/ivy-hero.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* the creature bleeds past the right column toward the viewport edge —
           clip here so the page never scrolls horizontally. Always-dark band. */
        .hero-root {
          overflow-x: clip;
          /* the site's dark base — the video's void is authored to match it,
             so the box edges vanish and there's no seam with the page below */
          background: var(--bg);
        }
        .hero-grid {
          grid-template-columns: 46% 54%;
        }
        .hero-headline {
          font-size: clamp(2.6rem, 4.6vw, 4.3rem);
          letter-spacing: -0.03em;
          line-height: 1.02;
        }

        .hero-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-height: 100%;
        }
        .hero-video-wrap {
          width: ${VIDEO_WIDTH};
          transform: translate(${VIDEO_SHIFT}, ${VIDEO_DROP});
        }
        .hero-video {
          width: 100%;
          height: auto;
          display: block;
          /* LIGHTEN = max(video, page): the dark void + its noise fall below
             page-black and get replaced by it, so the box is gone and the
             creature floats free — no rectangular edge on the dark page. */
          mix-blend-mode: lighten;
          /* bottom melt so the creature dissolves into the section below. */
          -webkit-mask-image: linear-gradient(to bottom, #000 ${FADE_START}, transparent ${FADE_END});
          mask-image: linear-gradient(to bottom, #000 ${FADE_START}, transparent ${FADE_END});
        }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; }
          .hero-right {
            justify-content: center;
            padding: 0 0 1.5rem;
          }
          .hero-video-wrap {
            width: 108%;
            transform: none;
          }
        }
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
        }
      `}</style>
    </div>
  );
}
