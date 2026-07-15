'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { CREW_THESIS } from '@/content/landing-copy';

// =============================================================================
// CREW THESIS (Phase 2.5) — the short manifesto beat: agents share context,
// one operation. The My Krew MacBook render sits on the LEFT (bleeding off the
// left edge), copy on the RIGHT. Copy (which names the crew by design) comes
// from content/landing-copy.ts, so this component stays free of agent strings.
//
// Same treatment as the Integrations section: the render sits on pure #000, so
// `mix-blend-mode: lighten` over the section's own `var(--bg)` backdrop drops
// the black, and a top+bottom mask dissolves it into the page.
// Quiet scroll reveal per KREW-DESIGN §5.
// =============================================================================

// ── Render knobs — tweak these freely (desktop only) ──
const MAC_SCALE = 1.15; //  size: 1 = fills its column; lower = smaller
const MAC_X = '0px'; //     move horizontally: positive = right, negative = left
const MAC_Y = '0px'; //     move vertically:   positive = down,  negative = up
const MAC_FADE = '18%'; //  top+bottom dissolve — higher = more fade into black

export default function CrewThesisSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} data-in={inView || undefined} className="crew-thesis">
      {/* copy — the site's centred container, sitting on the right
          (first in DOM so it stacks on top on mobile) */}
      <div className="ct-copy-wrap">
        <div className="ct-copy">
          <h2 className="ct-headline">{CREW_THESIS.headline}</h2>
          <p className="ct-body">{CREW_THESIS.body}</p>
        </div>
      </div>

      {/* render — bleeds off the left edge */}
      <div className="ct-inner">
        <div className="ct-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="ct-mac"
            style={{
              ['--mac-scale' as string]: `${MAC_SCALE}`,
              ['--mac-x' as string]: MAC_X,
              ['--mac-y' as string]: MAC_Y,
              ['--mac-fade' as string]: MAC_FADE,
            }}
            src={CREW_THESIS.image}
            alt="My Krew on a MacBook — every agent in one view"
            draggable={false}
          />
        </div>
      </div>

      <style jsx>{`
        .crew-thesis {
          position: relative;
          overflow: hidden;
          border-top: 1px solid var(--border);
          /* solid backdrop so the render's mix-blend-mode: lighten has a target */
          background: var(--bg);
          padding: clamp(4rem, 10vw, 8rem) 0;
        }

        /* ── Render grid (placement driven by the knobs) ── */
        .ct-inner {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          align-items: center;
          gap: clamp(1.5rem, 3vw, 3rem);
          /* right padding only → the render bleeds full-width off the LEFT edge */
          padding-right: clamp(1.5rem, 7vw, 7rem);
          min-height: 26rem;
        }
        .ct-media {
          grid-column: 1;
          position: relative;
        }
        .ct-mac {
          width: 100%;
          height: auto;
          display: block;
          mix-blend-mode: lighten;
          pointer-events: none;
          transform: translate(var(--mac-x, 0px), var(--mac-y, 0px))
            scale(var(--mac-scale, 1));
          transform-origin: center;
          /* clean dissolve on the top + bottom edges only (MAC_FADE knob) */
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            #000 var(--mac-fade, 14%),
            #000 calc(100% - var(--mac-fade, 14%)),
            transparent 100%
          );
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            #000 var(--mac-fade, 14%),
            #000 calc(100% - var(--mac-fade, 14%)),
            transparent 100%
          );
        }

        /* ── Copy — centred container, aligned with the rest of the site ── */
        .ct-copy-wrap {
          position: absolute;
          inset: 0;
          z-index: 2;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          pointer-events: none;
        }
        .ct-copy {
          max-width: 470px;
          pointer-events: auto;
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .crew-thesis[data-in] .ct-copy {
          opacity: 1;
          transform: none;
        }
        .ct-headline {
          font-size: clamp(1.85rem, 3.7vw, 2.75rem);
          font-weight: 300;
          letter-spacing: -0.035em;
          line-height: 1.12;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
          text-wrap: balance;
        }
        .ct-body {
          font-size: 1.02rem;
          font-weight: 300;
          line-height: 1.75;
          letter-spacing: -0.005em;
          color: var(--text-secondary);
          max-width: 430px;
        }

        /* ── Mobile: stack — copy on top, then the full-bleed render ── */
        @media (max-width: 900px) {
          .crew-thesis {
            padding: 4rem 0;
          }
          .ct-copy-wrap {
            position: static;
            display: block;
            max-width: 460px;
            margin: 0 auto;
            padding: 0 1.4rem;
            text-align: center;
          }
          .ct-copy {
            max-width: 100%;
          }
          .ct-inner {
            grid-template-columns: 1fr;
            padding-right: 0;
            min-height: 0;
            margin-top: 2.2rem;
          }
          .ct-media {
            grid-column: 1;
            width: 100%;
          }
          /* knobs are desktop-only — keep the mobile render put */
          .ct-mac {
            transform: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ct-copy {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
