'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { getLiveAgent } from '@/lib/agents';
import { getPocketContent } from '@/content/agent-content';

// =============================================================================
// POCKET BEAT (homepage, after the hero) — an asset-driven agent moment: the
// punchline sits up top (always readable), and the live agent's phone
// push-notification render sits below it, cropped to the notification with its
// empty screen dissolving into the page. On scroll both fade in and the phone
// drifts up a touch. Registry-driven; no coded UI mock.
//
// prefers-reduced-motion: everything static + visible, no scroll dependence.
// =============================================================================

// ── TUNING — the whole beat's feel lives here ──
const PHONE_WIDTH = 'min(430px, 46vw)'; // overall phone size
const PHONE_ASPECT = '5 / 6';           // portrait crop window (taller = more phone)
const NOTIF_FOCUS = '30%';              // vertical framing: lower % shows higher up the phone
const FADE_START = '62%';               // where the phone starts dissolving
const FADE_END = '99%';                 // where it's fully gone
const DRIFT = 40;                       // px the phone drifts up across the scroll

export default function PocketSection() {
  const agent = getLiveAgent();
  const pocket = getPocketContent(agent.slug);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const copyOpacity = useTransform(scrollYProgress, [0.08, 0.34], [0, 1]);
  const copyY = useTransform(scrollYProgress, [0.08, 0.4], [44, 0]);
  const phoneOpacity = useTransform(scrollYProgress, [0.04, 0.32], [0, 1]);
  const phoneY = useTransform(scrollYProgress, [0.04, 1], [DRIFT, -DRIFT]);
  const glowOpacity = useTransform(scrollYProgress, [0.05, 0.4], [0, 1]);

  if (!pocket) return null;

  const copyStyle = reduce ? undefined : { opacity: copyOpacity, y: copyY };
  const phoneStyle = reduce ? undefined : { opacity: phoneOpacity, y: phoneY };
  const glowStyle = reduce ? undefined : { opacity: glowOpacity };

  return (
    <section ref={ref} className="pk" data-agent={agent.slug}>
      <div className="pk-inner">
        <motion.div className="pk-copy" style={copyStyle}>
          <div className="pk-eyebrow">
            {agent.name} — {agent.role}
          </div>
          <h2 className="pk-headline">{pocket.headline}</h2>
          <p className="pk-sub">{pocket.sub}</p>
        </motion.div>

        <motion.div className="pk-phone-wrap" style={phoneStyle}>
          <motion.div className="pk-glow" style={glowStyle} aria-hidden="true" />
          <div className="pk-phone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pocket.image} alt="" draggable={false} />
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .pk {
          position: relative;
          padding: 7rem 2rem 3rem;
          overflow: hidden;
        }
        .pk-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .pk-copy {
          max-width: 680px;
        }
        .pk-eyebrow {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-tertiary);
          margin-bottom: 1.3rem;
        }
        .pk-headline {
          font-size: clamp(1.9rem, 4.4vw, 3.3rem);
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
          max-width: 480px;
          margin: 1.2rem auto 0;
        }

        .pk-phone-wrap {
          position: relative;
          margin-top: 2.5rem;
          display: flex;
          justify-content: center;
        }
        .pk-glow {
          position: absolute;
          top: 34%;
          left: 50%;
          width: 130%;
          padding-bottom: 130%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, var(--agent-accent-soft), transparent 62%);
          pointer-events: none;
          z-index: 0;
        }
        .pk-phone {
          position: relative;
          z-index: 1;
          width: ${PHONE_WIDTH};
          aspect-ratio: ${PHONE_ASPECT};
          overflow: hidden;
          /* the empty lower phone dissolves into the page — no hard edge */
          -webkit-mask-image: linear-gradient(to bottom, #000 ${FADE_START}, transparent ${FADE_END});
          mask-image: linear-gradient(to bottom, #000 ${FADE_START}, transparent ${FADE_END});
        }
        .pk-phone img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center ${NOTIF_FOCUS};
          display: block;
          filter: drop-shadow(0 30px 50px rgba(10, 10, 10, 0.22));
        }

        @media (max-width: 768px) {
          .pk {
            padding: 4.5rem 1.4rem 2rem;
          }
          .pk-phone {
            width: min(320px, 78vw);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pk-copy,
          .pk-phone-wrap,
          .pk-glow {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
