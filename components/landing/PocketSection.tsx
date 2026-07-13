'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { getLiveAgent } from '@/lib/agents';
import { getPocketContent } from '@/content/agent-content';

// =============================================================================
// POCKET BEAT (homepage, after the hero) — a pinned scroll moment. The phone
// (live agent's push-notification render, cropped to the notification with its
// empty screen dissolving) starts BIG and centred; as you scroll it scales
// DOWN in place while the punchline rises up from behind it and settles at the
// top — landing on the beat where the headline and the notification read
// together. Then the pin releases and the page scrolls on.
//
// prefers-reduced-motion / mobile: no pin/scrub — a clean stacked card
// (headline above, phone below), fully visible.
// =============================================================================

// ── TUNING — the whole beat's feel lives here ──
const PHONE_WIDTH = 'min(440px, 46vw)'; // base phone size (before scale)
const PHONE_ASPECT = '5 / 6';           // portrait crop window
const NOTIF_FOCUS = '30%';              // vertical framing: lower % shows higher up the phone
const FADE_START = '60%';               // where the phone starts dissolving
const FADE_END = '99%';                 // where it's fully gone
const SCALE_FROM = 1.34;                // phone size at the START of the scrub (big)
const SCALE_TO = 0.74;                  // …and at the END (small — the "moment")
const COPY_RISE_FROM = '36vh';          // where the title starts (behind the phone)
const COPY_TOP = '13vh';                // where the title lands (near the top)

export default function PocketSection() {
  const agent = getLiveAgent();
  const pocket = getPocketContent(agent.slug);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  // progress across the pinned scrub (0 when it pins, 1 when it releases)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const phoneScale = useTransform(scrollYProgress, [0, 1], [SCALE_FROM, SCALE_TO]);
  const phoneY = useTransform(scrollYProgress, [0, 1], ['0vh', '-3vh']);
  const copyOpacity = useTransform(scrollYProgress, [0.24, 0.54], [0, 1]);
  const copyY = useTransform(scrollYProgress, [0.18, 0.64], [COPY_RISE_FROM, '0vh']);
  const glowOpacity = useTransform(scrollYProgress, [0.04, 0.4], [0, 1]);

  if (!pocket) return null;

  const phoneStyle = reduce ? undefined : { scale: phoneScale, y: phoneY };
  const copyStyle = reduce ? undefined : { opacity: copyOpacity, y: copyY };
  const glowStyle = reduce ? undefined : { opacity: glowOpacity };

  return (
    <section ref={ref} className="pk" data-agent={agent.slug}>
      <div className="pk-sticky">
        <motion.div className="pk-glow" style={glowStyle} aria-hidden="true" />

        {/* title layer — behind the phone, rises to the top on scroll */}
        <motion.div className="pk-copy" style={copyStyle}>
          <div className="pk-eyebrow">
            {agent.name} — {agent.role}
          </div>
          <h2 className="pk-headline">{pocket.headline}</h2>
          <p className="pk-sub">{pocket.sub}</p>
        </motion.div>

        {/* phone layer — big → small in place */}
        <div className="pk-phone-layer">
          <motion.div className="pk-phone-wrap" style={phoneStyle}>
            <div className="pk-phone">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pocket.image} alt="" draggable={false} />
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .pk {
          position: relative;
          height: 200vh; /* 100vh pinned + 100vh of scrub runway */
        }
        .pk-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
        }

        .pk-glow {
          position: absolute;
          top: 52%;
          left: 50%;
          width: 70vh;
          height: 70vh;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, var(--agent-accent-soft), transparent 64%);
          pointer-events: none;
          z-index: 0;
        }

        /* title — anchored near the top; motion's y offsets it down at the
           start (behind the phone) and lifts it into place */
        .pk-copy {
          position: absolute;
          top: ${COPY_TOP};
          left: 0;
          right: 0;
          z-index: 1;
          text-align: center;
          padding: 0 2rem;
        }
        .pk-eyebrow {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-tertiary);
          margin-bottom: 1.2rem;
        }
        .pk-headline {
          font-size: clamp(1.9rem, 4.6vw, 3.5rem);
          font-weight: 300;
          letter-spacing: -0.035em;
          line-height: 1.08;
          color: var(--text-primary);
          max-width: 900px;
          margin: 0 auto;
        }
        .pk-sub {
          font-size: 0.92rem;
          font-weight: 300;
          line-height: 1.75;
          color: var(--text-secondary);
          max-width: 480px;
          margin: 1.1rem auto 0;
        }

        /* phone sits above the title (occludes it at the start) */
        .pk-phone-layer {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pk-phone-wrap {
          transform-origin: center center;
        }
        .pk-phone {
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
          filter: drop-shadow(0 30px 55px rgba(10, 10, 10, 0.26));
        }

        /* ── Reduced motion / mobile: no pin — clean stacked card ── */
        @media (prefers-reduced-motion: reduce), (max-width: 768px) {
          .pk {
            height: auto;
          }
          .pk-sticky {
            position: static;
            height: auto;
            padding: 5rem 1.4rem 3rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2.5rem;
            overflow: visible;
          }
          .pk-glow {
            top: 60%;
          }
          .pk-copy {
            position: static;
            transform: none !important;
            opacity: 1 !important;
          }
          .pk-phone-layer {
            position: static;
            display: block;
          }
          .pk-phone-wrap {
            transform: none !important;
            display: flex;
            justify-content: center;
          }
          .pk-phone {
            width: min(320px, 76vw);
          }
        }
      `}</style>
    </section>
  );
}
