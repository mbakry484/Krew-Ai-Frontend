'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { INTEGRATIONS } from '@/content/landing-copy';

// =============================================================================
// INTEGRATIONS (homepage, section 6) — "Krew works where your business already
// lives." Copy + a transparent logo strip in the site's centred container on the
// LEFT; a frontal phone render (the Krew Integrations screen) bleeding full-width
// on the RIGHT. The render sits on pure #000, so `mix-blend-mode: lighten` over
// the section's own `var(--bg)` backdrop drops the black; a top+bottom mask then
// dissolves it cleanly into the page. Copy lives in content/landing-copy.ts.
//
// Layout: the phone lives in `.integ-inner` (a full-width grid) so the knobs
// below place it freely; the copy is a separate centred overlay, so moving/
// scaling the phone never disturbs the copy and vice-versa.
// =============================================================================

// ── Phone render knobs — tweak these freely (desktop only) ──
const PHONE_SCALE = 1.5; //  size: 1 = fills its column; lower = smaller
const PHONE_X = '-230px'; // move horizontally: positive = right, negative = left
const PHONE_Y = '0px'; //    move vertically:   positive = down,  negative = up
const PHONE_FADE = '30%'; // top+bottom dissolve — higher = more fade into black

export default function IntegrationsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} data-in={inView || undefined} className="integ">
      {/* copy — the site's centred container (desktop overlay / mobile: on top) */}
      <div className="integ-copy-wrap">
        <div className="integ-copy">
          <div className="integ-eyebrow">{INTEGRATIONS.eyebrow}</div>
          <h2 className="integ-headline">{INTEGRATIONS.headline}</h2>
          <p className="integ-body">{INTEGRATIONS.body}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="integ-logos"
            src={INTEGRATIONS.logos}
            alt="Meta, Instagram, Shopify, Telegram, Bosta"
            draggable={false}
          />
        </div>
      </div>

      {/* phone — placed by the knobs; full-width, bleeds off the right edge */}
      <div className="integ-inner">
        <div className="integ-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="integ-phone"
            style={{
              ['--phone-scale' as string]: `${PHONE_SCALE}`,
              ['--phone-x' as string]: PHONE_X,
              ['--phone-y' as string]: PHONE_Y,
              ['--phone-fade' as string]: PHONE_FADE,
            }}
            src={INTEGRATIONS.phone}
            alt="The Krew integrations screen — Instagram, Shopify, Telegram and Bosta connected"
            draggable={false}
          />
        </div>
      </div>

      <style jsx>{`
        .integ {
          position: relative;
          overflow: hidden;
          /* solid backdrop so the phone's mix-blend-mode: lighten has a target */
          background: var(--bg);
          padding: clamp(4rem, 10vw, 8rem) 0;
        }

        /* ── Phone grid (placement driven by the knobs) ── */
        .integ-inner {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          align-items: center;
          gap: clamp(1.5rem, 3vw, 3rem);
          /* left padding only → the render bleeds full-width to the right edge */
          padding-left: clamp(1.5rem, 7vw, 7rem);
          min-height: 26rem;
        }
        .integ-media {
          grid-column: 2;
          position: relative;
        }
        .integ-phone {
          width: 100%;
          height: auto;
          display: block;
          mix-blend-mode: lighten;
          pointer-events: none;
          /* driven by the PHONE_SCALE / PHONE_X / PHONE_Y knobs at top of file */
          transform: translate(var(--phone-x, 0px), var(--phone-y, 0px))
            scale(var(--phone-scale, 1));
          transform-origin: center;
          /* clean dissolve on the top + bottom edges only (PHONE_FADE knob) */
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            #000 var(--phone-fade, 12%),
            #000 calc(100% - var(--phone-fade, 12%)),
            transparent 100%
          );
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            #000 var(--phone-fade, 12%),
            #000 calc(100% - var(--phone-fade, 12%)),
            transparent 100%
          );
        }

        /* ── Copy — centred container, aligned with the rest of the site ── */
        .integ-copy-wrap {
          position: absolute;
          inset: 0;
          z-index: 2;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          pointer-events: none;
        }
        .integ-copy {
          max-width: 460px;
          pointer-events: auto;
          opacity: 0;
          transform: translateY(18px);
          transition:
            opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .integ[data-in] .integ-copy {
          opacity: 1;
          transform: none;
        }
        .integ-eyebrow {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--text-tertiary);
          margin-bottom: 1.1rem;
        }
        .integ-headline {
          font-size: clamp(2rem, 4vw, 3.1rem);
          font-weight: 300;
          letter-spacing: -0.035em;
          line-height: 1.08;
          color: var(--text-primary);
        }
        .integ-body {
          margin-top: 1.4rem;
          font-size: 0.95rem;
          font-weight: 300;
          line-height: 1.8;
          color: var(--text-secondary);
          max-width: 440px;
        }
        .integ-logos {
          margin-top: 2.4rem;
          width: 100%;
          max-width: 400px;
          height: auto;
          display: block;
          opacity: 0.92;
        }

        /* ── Mobile: stack — copy on top, then the full-bleed phone ── */
        @media (max-width: 900px) {
          .integ {
            padding: 4rem 0;
          }
          .integ-copy-wrap {
            position: static;
            display: block;
            max-width: 460px;
            margin: 0 auto;
            padding: 0 1.4rem;
            text-align: center;
          }
          .integ-copy {
            max-width: 100%;
          }
          .integ-body,
          .integ-logos {
            margin-left: auto;
            margin-right: auto;
          }
          .integ-inner {
            grid-template-columns: 1fr;
            padding-left: 0;
            min-height: 0;
            margin-top: 2.2rem;
          }
          .integ-media {
            grid-column: 1;
            width: 100%;
          }
          /* knobs are desktop-only — keep the mobile phone put */
          .integ-phone {
            transform: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .integ-copy {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
