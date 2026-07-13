'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { getLiveAgent } from '@/lib/agents';
import { getPocketContent } from '@/content/agent-content';

// =============================================================================
// POCKET BEAT (homepage, after the hero) — an asset-driven scroll moment: the
// live agent's phone push-notification render rises up the pinned stage while
// the punchline is uncovered from behind it and settles in. Registry-driven
// (renders from the live agent + its pocket content); no coded UI mock.
//
// prefers-reduced-motion: static — phone up top, copy visible, no scrub.
// Desktop only; on mobile it collapses to a simple stacked, non-pinned card.
// =============================================================================

// ── TUNING — the whole beat's feel lives here ──
// phone travels up as you scroll (start → end), and shrinks a touch:
const PHONE_RISE_FROM = '8vh';
const PHONE_RISE_TO = '-34vh';
const PHONE_SCALE_FROM = 1.04;
const PHONE_SCALE_TO = 0.8;
const PHONE_HEIGHT = '108vh'; // image is square; the phone reads ~55% of this
// copy sits just below centre so the lifted phone never overlaps it:
const COPY_DROP = '10vh';

export default function PocketSection() {
  const agent = getLiveAgent();
  const pocket = getPocketContent(agent.slug);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const phoneY = useTransform(scrollYProgress, [0, 1], [PHONE_RISE_FROM, PHONE_RISE_TO]);
  const phoneScale = useTransform(scrollYProgress, [0, 1], [PHONE_SCALE_FROM, PHONE_SCALE_TO]);
  const copyOpacity = useTransform(scrollYProgress, [0.16, 0.5], [0, 1]);
  const copyY = useTransform(scrollYProgress, [0.16, 0.6], [46, 0]);
  const glowOpacity = useTransform(scrollYProgress, [0.08, 0.5], [0, 1]);

  if (!pocket) return null;

  const phoneStyle = reduce ? undefined : { y: phoneY, scale: phoneScale };
  const copyStyle = reduce ? undefined : { opacity: copyOpacity, y: copyY };
  const glowStyle = reduce ? undefined : { opacity: glowOpacity };

  return (
    <section ref={ref} className="pk" data-agent={agent.slug} data-reduce={reduce || undefined}>
      <div className="pk-sticky">
        {/* accent glow behind everything */}
        <motion.div className="pk-glow" style={glowStyle} aria-hidden="true" />

        {/* copy layer — sits just below centre, revealed from behind the phone.
            The drop lives on the anchor so it composes with motion's transform. */}
        <div className="pk-layer">
          <div className="pk-copy-anchor">
            <motion.div className="pk-copy" style={copyStyle}>
              <div className="pk-eyebrow">
                {agent.name} — {agent.role}
              </div>
              <h2 className="pk-headline">{pocket.headline}</h2>
              <p className="pk-sub">{pocket.sub}</p>
            </motion.div>
          </div>
        </div>

        {/* phone layer — the star; rises + shrinks on scroll */}
        <div className="pk-layer pk-layer-phone">
          <motion.div className="pk-phone" style={phoneStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pocket.image} alt="" draggable={false} style={{ height: PHONE_HEIGHT }} />
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .pk {
          position: relative;
          height: 200vh; /* 100vh pinned + 100vh of scroll runway */
        }
        .pk-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
        }

        .pk-glow {
          position: absolute;
          top: 42%;
          left: 50%;
          width: 60vw;
          height: 60vw;
          max-width: 760px;
          max-height: 760px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, var(--agent-accent-soft), transparent 66%);
          pointer-events: none;
        }

        .pk-layer {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .pk-layer-phone {
          z-index: 2;
        }

        .pk-copy-anchor {
          transform: translateY(${COPY_DROP});
        }
        .pk-copy {
          position: relative;
          text-align: center;
          max-width: 680px;
          padding: 0 2rem;
        }
        .pk-eyebrow {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-tertiary);
          margin-bottom: 1.3rem;
        }
        .pk-headline {
          font-size: clamp(1.9rem, 4.4vw, 3.4rem);
          font-weight: 300;
          letter-spacing: -0.035em;
          line-height: 1.08;
          color: var(--text-primary);
        }
        .pk-sub {
          font-size: 0.92rem;
          font-weight: 300;
          line-height: 1.75;
          color: var(--text-secondary);
          max-width: 500px;
          margin: 1.2rem auto 0;
        }

        .pk-phone {
          transform-origin: center center;
          filter: drop-shadow(0 40px 70px rgba(10, 10, 10, 0.3));
        }
        .pk-phone img {
          width: auto;
          display: block;
        }

        /* ── Mobile: no pin, no scrub — a clean stacked card ── */
        @media (max-width: 768px) {
          .pk {
            height: auto;
          }
          .pk-sticky {
            position: static;
            height: auto;
            padding: 5rem 1.4rem 5.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
          }
          .pk-glow {
            top: 40%;
            width: 90vw;
            height: 90vw;
          }
          .pk-layer,
          .pk-layer-phone {
            position: static;
            display: block;
          }
          .pk-copy-anchor {
            transform: none;
          }
          .pk-phone {
            display: flex;
            justify-content: center;
          }
          .pk-phone img {
            height: auto !important;
            width: min(300px, 74vw);
          }
        }

        /* Reduced motion — no pin/scrub; the same clean stacked layout as
           mobile (phone above, copy below), fully visible. */
        @media (prefers-reduced-motion: reduce) {
          .pk {
            height: auto;
          }
          .pk-sticky {
            position: static;
            height: auto;
            padding: 5rem 1.4rem 5.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2.5rem;
            overflow: visible;
          }
          .pk-glow {
            top: 38%;
          }
          .pk-layer,
          .pk-layer-phone {
            position: static;
            display: block;
          }
          .pk-copy-anchor {
            transform: none;
          }
          .pk-phone {
            display: flex;
            justify-content: center;
          }
          .pk-phone img {
            height: auto !important;
            width: min(340px, 74vw);
          }
        }
      `}</style>
    </section>
  );
}
