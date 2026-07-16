'use client';

import { useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { TELEGRAM_SECTION } from '@/content/landing-copy';

// =============================================================================
// TELEGRAM BEAT (homepage, section 4) — "Your agents are employees you talk to."
//
// A pinned scroll on BOTH desktop and mobile: the phone stays fixed while
// scrolling advances the feature; when the four are done the pin releases and
// the page scrolls on. Desktop: phone + a stepper, pulled together and centred
// as one composition. Mobile: phone on top, one focused feature (tag/title/body)
// below it, swapping as you scroll. Copy is a crew-wide brand moment (names all
// three agents) so it lives in content/landing-copy.ts; the rail is neutral white.
//
// The renders sit on pure #000. `mix-blend-mode: lighten` drops that black, but
// it needs a solid backdrop — so `.tg` and the sticky (its own stacking context)
// both carry `background: var(--bg)`. No per-file processing → swap-by-name safe.
// prefers-reduced-motion: no pin — four static blocks instead.
// =============================================================================

export default function TelegramSection() {
  const { eyebrow, headline, steps } = TELEGRAM_SECTION;
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const i = Math.min(steps.length - 1, Math.max(0, Math.floor(p * steps.length)));
    setActive(i);
  });

  return (
    <section ref={ref} className="tg">
      {/* ── Pinned composition (desktop + mobile) ── */}
      <div className="tg-sticky">
        <div className="tg-head">
          <div className="tg-eyebrow">{eyebrow}</div>
          <h2 className="tg-headline">{headline}</h2>
        </div>

        <div className="tg-phone">
          {steps.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.img}
              src={s.img}
              alt={s.title}
              className="tg-phone-img"
              data-on={i === active ? 'true' : undefined}
              draggable={false}
            />
          ))}
        </div>

        <div className="tg-stepper">
          {steps.map((s, i) => (
            <div
              key={s.tag}
              className="tg-step"
              data-state={i < active ? 'past' : i === active ? 'active' : 'future'}
            >
              <span className="tg-node" aria-hidden="true" />
              <div className="tg-step-main">
                <div className="tg-tag">{s.tag}</div>
                <h3 className="tg-title">{s.title}</h3>
                <p className="tg-body">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reduced-motion fallback: four static blocks, no pin ── */}
      <div className="tg-static">
        <div className="tg-head tg-static-head">
          <div className="tg-eyebrow">{eyebrow}</div>
          <h2 className="tg-headline">{headline}</h2>
        </div>
        {steps.map((s) => (
          <div key={s.tag} className="tg-static-feature">
            <div className="tg-static-phone">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.img} alt={s.title} draggable={false} />
            </div>
            <div className="tg-tag">{s.tag}</div>
            <h3 className="tg-static-title">{s.title}</h3>
            <p className="tg-static-body">{s.body}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .tg {
          position: relative;
          height: 360vh;
          background: var(--bg);
        }

        /* ── Pinned composition ── */
        .tg-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
          background: var(--bg);
          display: grid;
          grid-template-columns: min(40vw, 430px) minmax(0, 400px);
          grid-template-areas:
            'phone head'
            'phone stepper';
          align-content: center;
          justify-content: center;
          column-gap: clamp(1.5rem, 3vw, 3rem);
          row-gap: 1.4rem;
          max-width: 940px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        .tg-head {
          grid-area: head;
          align-self: end;
        }
        .tg-phone {
          grid-area: phone;
          align-self: center;
          position: relative;
          height: min(78vh, 660px);
        }
        .tg-stepper {
          grid-area: stepper;
          align-self: start;
        }

        .tg-phone-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform: scale(1.82);
          transform-origin: center;
          mix-blend-mode: lighten;
          opacity: 0;
          transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }
        .tg-phone-img[data-on] {
          opacity: 1;
        }

        /* ── Type ── */
        .tg-eyebrow {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--text-tertiary);
          margin-bottom: 0.9rem;
        }
        .tg-headline {
          font-size: clamp(1.7rem, 3.2vw, 2.5rem);
          font-weight: 300;
          letter-spacing: -0.035em;
          line-height: 1.08;
          color: var(--text-primary);
        }

        /* ── Stepper ── */
        .tg-stepper {
          position: relative;
          padding-left: 30px;
        }
        .tg-stepper::before {
          content: '';
          position: absolute;
          left: 5px;
          top: 12px;
          bottom: 12px;
          width: 1px;
          background: var(--border);
        }
        .tg-step {
          position: relative;
          padding: 0.8rem 0;
          opacity: 0.42;
          transition: opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tg-step[data-state='active'] {
          opacity: 1;
        }
        .tg-node {
          position: absolute;
          left: -30px;
          top: 1.1rem;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: var(--bg);
          border: 1px solid var(--border-md, var(--border));
          transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
        }
        .tg-step[data-state='past'] .tg-node {
          background: var(--text-tertiary);
          border-color: transparent;
        }
        .tg-step[data-state='active'] .tg-node {
          background: var(--text-primary);
          border-color: var(--text-primary);
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.08);
        }
        .tg-tag {
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          transition: color 0.4s ease;
        }
        .tg-step[data-state='active'] .tg-tag {
          color: var(--text-secondary);
        }
        .tg-title {
          font-size: 1.12rem;
          font-weight: 300;
          letter-spacing: -0.02em;
          line-height: 1.25;
          color: var(--text-secondary);
          margin-top: 0.35rem;
          transition: color 0.4s ease;
        }
        .tg-step[data-state='active'] .tg-title {
          color: var(--text-primary);
        }
        .tg-body {
          font-size: 0.82rem;
          font-weight: 300;
          line-height: 1.7;
          color: var(--text-secondary);
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition:
            max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
            margin-top 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tg-step[data-state='active'] .tg-body {
          max-height: 10rem;
          opacity: 1;
          margin-top: 0.55rem;
        }

        /* ── Mobile: still pinned; phone on top, one focused feature below ── */
        @media (max-width: 900px) {
          .tg {
            height: 320vh;
          }
          .tg-sticky {
            grid-template-columns: 1fr;
            grid-template-areas:
              'head'
              'phone'
              'stepper';
            align-content: center;
            row-gap: 1.2rem;
            max-width: 460px;
            padding: 0 1.4rem;
          }
          .tg-head {
            align-self: auto;
            text-align: center;
          }
          .tg-phone {
            align-self: auto;
            height: 44vh;
          }
          .tg-phone-img {
            transform: scale(1.44);
          }
          /* collapse the stepper to a single centred, focused feature */
          .tg-stepper {
            padding-left: 0;
            text-align: center;
          }
          .tg-stepper::before {
            display: none;
          }
          .tg-node {
            display: none;
          }
          .tg-step {
            display: none;
            padding: 0;
            opacity: 1;
          }
          .tg-step[data-state='active'] {
            display: block;
          }
          .tg-title {
            font-size: 1.3rem;
          }
          .tg-body {
            max-height: none;
            opacity: 1;
            overflow: visible;
            margin: 0.55rem auto 0;
            max-width: 380px;
          }
        }

        /* ── Reduced motion: no pin — static blocks ── */
        .tg-static {
          display: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .tg {
            height: auto;
          }
          .tg-sticky {
            display: none;
          }
          .tg-static {
            display: block;
            padding: 4rem 1.4rem 2rem;
          }
          .tg-static-head {
            text-align: center;
            margin-bottom: 1rem;
          }
          .tg-static-feature {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 2.5rem 0;
          }
          .tg-static-phone {
            position: relative;
            width: 100%;
            max-width: 420px;
            height: 58vh;
            overflow: hidden;
          }
          .tg-static-phone img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            transform: scale(1.49);
            mix-blend-mode: lighten;
          }
          .tg-static-title {
            margin-top: 0.5rem;
            font-size: 1.3rem;
            font-weight: 300;
            letter-spacing: -0.02em;
            color: var(--text-primary);
          }
          .tg-static-body {
            margin: 0.7rem auto 0;
            max-width: 380px;
            font-size: 0.88rem;
            font-weight: 300;
            line-height: 1.7;
            color: var(--text-secondary);
          }
        }
      `}</style>
    </section>
  );
}
