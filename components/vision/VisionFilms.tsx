'use client';

import { useEffect, useRef, useState } from 'react';
import { getAgent } from '@/lib/agents';
import AgentMascot from '@/components/agents/AgentMascot';
import { VISION_FILMS } from '@/content/vision-copy';

// =============================================================================
// VISION FILMS (/about/vision) — "This is what running a brand should look like."
//
// Four brand films in an expanding accordion (the ElevenLabs mechanic): the
// active card is wide and playing, the rest collapse into narrow slivers of
// their footage; clicking a sliver expands it and collapses the previous one.
// The arc is sleep → health → people → craft, closing on the second-person line.
//
// Each film carries two coded overlays, never baked into footage: the editorial
// center line (fades in after the film breathes ~1.6s) and one agent
// notification chip (staggers in at ~3.4s — line and chip never arrive
// together). Chip identity comes from the registry; copy from vision-copy.ts.
//
// The row auto-advances every ~8s until the user clicks a sliver, and only
// while the section is on screen. Mobile (≤900px): vertical stack, each card
// plays + reveals its overlays when in view. prefers-reduced-motion: nothing
// autoplays — posters with overlays resolved, instant (untransitioned) expand.
// =============================================================================

const ADVANCE_MS = 8200;

export default function VisionFilms() {
  const { headline, films } = VISION_FILMS;

  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const prevFeatured = useRef<boolean[]>(films.map(() => false));

  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [inView, setInView] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState<boolean[]>(() => films.map(() => false));

  const isFeatured = (i: number) => (stacked ? visible[i] : i === active && inView);

  // Layout + motion-preference media queries (SSR-safe).
  useEffect(() => {
    const mqStack = window.matchMedia('(max-width: 900px)');
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncStack = () => setStacked(mqStack.matches);
    const syncReduce = () => setReduced(mqReduce.matches);
    syncStack();
    syncReduce();
    mqStack.addEventListener('change', syncStack);
    mqReduce.addEventListener('change', syncReduce);
    return () => {
      mqStack.removeEventListener('change', syncStack);
      mqReduce.removeEventListener('change', syncReduce);
    };
  }, []);

  // Section visibility — gates playback, overlay timing, and auto-advance.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Per-card visibility drives the stacked (mobile) mode.
  useEffect(() => {
    if (!stacked) return;
    const els = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    const io = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = [...prev];
          for (const e of entries) {
            const i = Number((e.target as HTMLElement).dataset.index);
            if (!Number.isNaN(i)) next[i] = e.isIntersecting;
          }
          return next;
        });
      },
      { threshold: 0.45 }
    );
    els.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [stacked]);

  // Playback controller: a film plays iff featured; the newly featured film in
  // accordion mode restarts from 0 so footage and overlay timing stay in step.
  useEffect(() => {
    films.forEach((_, i) => {
      const v = videoRefs.current[i];
      if (!v) return;
      const featured = isFeatured(i);
      if (featured && !reduced) {
        if (!stacked && !prevFeatured.current[i]) v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
      prevFeatured.current[i] = featured;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, inView, stacked, reduced, visible]);

  // Auto-advance the accordion until the user takes over.
  useEffect(() => {
    if (stacked || reduced || interacted || !inView) return;
    const t = setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % films.length);
    }, ADVANCE_MS);
    return () => clearInterval(t);
  }, [stacked, reduced, interacted, inView, films.length]);

  return (
    <section ref={sectionRef} className="vf">
      <h2 className="vf-headline">{headline}</h2>

      <div className="vf-row">
        {films.map((film, i) => {
          const agent = getAgent(film.chipAgent);
          const on = isFeatured(i);
          return (
            <button
              key={film.id}
              type="button"
              className="vf-card"
              data-on={on || undefined}
              aria-pressed={!stacked && i === active}
              aria-label={film.line}
              onClick={() => {
                setInteracted(true);
                setActive(i);
              }}
            >
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                data-index={i}
                className="vf-media"
                src={film.video}
                poster={film.poster}
                preload="metadata"
                muted
                loop
                playsInline
                disablePictureInPicture
                tabIndex={-1}
              />
              <span className="vf-scrim" aria-hidden="true" />

              <span className="vf-line">{film.line}</span>

              <span className="vf-chip">
                <AgentMascot agent={agent} size={20} className="vf-chip-mascot" />
                <span className="vf-chip-name" style={{ color: agent.accent.base }}>
                  {agent.name}
                </span>
                <span className="vf-chip-text">{film.chipText}</span>
              </span>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .vf {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        .vf-headline {
          font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 300;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: var(--text-primary);
          max-width: 620px;
          margin-bottom: 3rem;
        }

        /* ── The accordion row ── */
        .vf-row {
          display: flex;
          gap: 10px;
          height: clamp(340px, 60vh, 580px);
        }
        .vf-card {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          border: none;
          padding: 0;
          background: var(--bg2);
          flex: 1 1 0%;
          min-width: 0;
          cursor: pointer;
          transition: flex-grow 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .vf-card[data-on] {
          flex-grow: 6;
          cursor: default;
        }
        .vf-card:focus-visible {
          outline: 1px solid var(--border-hover);
          outline-offset: 3px;
        }

        .vf-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.5) saturate(0.85);
          transition: filter 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }
        .vf-card[data-on] .vf-media {
          filter: none;
        }
        .vf-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10, 10, 10, 0.45), transparent 36%);
          opacity: 0;
          transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }
        .vf-card[data-on] .vf-scrim {
          opacity: 1;
        }

        /* ── The editorial line: film breathes first, then the voice ── */
        .vf-line {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, calc(-50% + 10px));
          width: min(78%, 480px);
          text-align: center;
          font-size: clamp(0.95rem, 1.7vw, 1.35rem);
          font-weight: 300;
          letter-spacing: 0.04em;
          line-height: 1.5;
          color: var(--text-primary);
          text-shadow: 0 1px 22px rgba(10, 10, 10, 0.55);
          opacity: 0;
          transition:
            opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }
        .vf-card[data-on] .vf-line {
          opacity: 1;
          transform: translate(-50%, -50%);
          transition-delay: 1.6s;
        }

        /* ── The agent chip: the proof, staggered after the voice ── */
        .vf-chip {
          position: absolute;
          left: 16px;
          bottom: 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          max-width: calc(100% - 32px);
          padding: 6px 14px 6px 8px;
          border-radius: 999px;
          background: rgba(10, 10, 10, 0.6);
          border: 1px solid var(--border);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          opacity: 0;
          transform: translateY(6px);
          transition:
            opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }
        .vf-card[data-on] .vf-chip {
          opacity: 1;
          transform: none;
          transition-delay: 3.4s;
        }
        /* Damp the mascot's ±6px idle float — too large inside a 20px avatar.
           Blink + glow breathing stay alive (KREW-DESIGN §4: never static). */
        .vf-chip :global(.agent-mascot[data-animated='true'] svg) {
          animation: none;
        }
        .vf-chip-name {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          flex: none;
        }
        .vf-chip-text {
          font-size: 0.72rem;
          font-weight: 300;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Mobile: vertical stack, cards feature when in view ── */
        @media (max-width: 900px) {
          .vf {
            padding: 0 1.4rem;
          }
          .vf-headline {
            margin-bottom: 2rem;
          }
          .vf-row {
            flex-direction: column;
            gap: 14px;
            height: auto;
          }
          .vf-card,
          .vf-card[data-on] {
            flex: none;
            width: 100%;
            aspect-ratio: 4 / 3;
            cursor: default;
          }
          .vf-line {
            width: 84%;
          }
          .vf-chip {
            left: 12px;
            bottom: 12px;
          }
        }

        /* ── Reduced motion: posters, resolved overlays, instant expand ── */
        @media (prefers-reduced-motion: reduce) {
          .vf-card,
          .vf-media,
          .vf-scrim,
          .vf-line,
          .vf-chip {
            transition: none;
          }
          .vf-card[data-on] .vf-line,
          .vf-card[data-on] .vf-chip {
            transition-delay: 0s;
          }
        }
      `}</style>
    </section>
  );
}
