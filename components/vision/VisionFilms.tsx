'use client';

import { useEffect, useRef, useState } from 'react';
import { getAgent } from '@/lib/agents';
import AgentMascot from '@/components/agents/AgentMascot';
import { VISION_FILMS } from '@/content/vision-copy';

// =============================================================================
// VISION FILMS HERO (/about/vision, page top) — "This is what running a brand
// should look like."
//
// ElevenLabs structure: bold headline left, the vision body right (no CTA),
// and the four brand films in an expanding accordion beneath: the active card
// is wide and playing, the rest collapse into narrow slivers of their footage.
// On hover-capable devices a sliver expands on hover (click on touch; focus
// works for keyboards). Display order yoga → dinner → sleep → work, closing
// on the second-person line.
//
// Each film carries two coded overlays, never baked into footage: the editorial
// center line (fades in after the film breathes ~1.6s) and one agent
// notification chip (staggers in at ~3.4s — line and chip never arrive
// together). Chip identity comes from the registry; copy from vision-copy.ts.
//
// The row auto-advances every ~8s while the pointer is off it (a touch click
// stops it for good), and only while the section is on screen. Mobile (≤900px):
// vertical stack, each card plays + reveals its overlays when in view.
// prefers-reduced-motion: nothing autoplays — posters with overlays resolved,
// instant (untransitioned) expand.
// =============================================================================

const ADVANCE_MS = 8200;

export default function VisionFilms() {
  const { eyebrow, headline, body, films } = VISION_FILMS;

  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const prevFeatured = useRef<boolean[]>(films.map(() => false));

  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState<boolean[]>(() => films.map(() => false));

  const isFeatured = (i: number) => (stacked ? visible[i] : i === active && inView);

  // Layout + input-capability + motion-preference media queries (SSR-safe).
  useEffect(() => {
    const queries: Array<[MediaQueryList, (m: boolean) => void]> = [
      [window.matchMedia('(max-width: 900px)'), setStacked],
      [window.matchMedia('(hover: hover) and (pointer: fine)'), setCanHover],
      [window.matchMedia('(prefers-reduced-motion: reduce)'), setReduced],
    ];
    const cleanups = queries.map(([mq, set]) => {
      const sync = () => set(mq.matches);
      sync();
      mq.addEventListener('change', sync);
      return () => mq.removeEventListener('change', sync);
    });
    return () => cleanups.forEach((fn) => fn());
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

  // Auto-advance the accordion — paused while the pointer is over the row,
  // stopped for good once a touch user clicks.
  useEffect(() => {
    if (stacked || reduced || interacted || hovering || !inView) return;
    const t = setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % films.length);
    }, ADVANCE_MS);
    return () => clearInterval(t);
  }, [stacked, reduced, interacted, hovering, inView, films.length]);

  return (
    <section ref={sectionRef} className="vf">
      {/* ── Hero copy: bold headline left, the vision body right ── */}
      <div className="vf-hero">
        <div>
          <p className="vf-eyebrow">{eyebrow}</p>
          <h1 className="vf-headline">{headline}</h1>
        </div>
        <p className="vf-body">{body}</p>
      </div>

      {/* ── The accordion row ── */}
      <div
        className="vf-row"
        onMouseEnter={() => canHover && setHovering(true)}
        onMouseLeave={() => canHover && setHovering(false)}
      >
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
              onMouseEnter={() => {
                if (canHover && !stacked) setActive(i);
              }}
              onFocus={() => {
                if (!stacked) setActive(i);
              }}
              onClick={() => {
                setActive(i);
                if (!canHover) setInteracted(true);
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

        /* ── Hero copy ── */
        .vf-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 400px);
          align-items: center;
          column-gap: clamp(2.5rem, 6vw, 6rem);
          margin-bottom: clamp(2.5rem, 5vh, 4rem);
        }
        .vf-eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-tertiary);
          margin-bottom: 18px;
        }
        .vf-headline {
          font-size: clamp(2.4rem, 5vw, 4.3rem);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1.04;
          color: var(--text-primary);
          max-width: 15ch;
        }
        .vf-body {
          font-size: clamp(0.92rem, 1.2vw, 1.05rem);
          font-weight: 300;
          line-height: 1.7;
          color: var(--text-secondary);
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

        /* ── Mobile: hero stacks; cards stack and feature when in view ── */
        @media (max-width: 900px) {
          .vf {
            padding: 0 1.4rem;
          }
          .vf-hero {
            grid-template-columns: 1fr;
            row-gap: 1.4rem;
            margin-bottom: 2rem;
          }
          .vf-body {
            max-width: 460px;
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
