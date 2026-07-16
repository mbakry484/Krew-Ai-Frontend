'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import CapitalCard, { cardDigits } from '@/app/dashboard/ivy/components/CapitalCard';
import { CapitalColor } from '@/lib/ivy/types';

// =============================================================================
// BUDGETS — "Capital, organized" (homepage, right after the pocket beat).
// Copy on the LEFT; the real Ivy capital cards (reused from the dashboard)
// cascade diagonally on the RIGHT — each one a purpose with its allocation, all
// clearly visible ("every pound has a job"). Cards fade+rise into place on
// scroll; hovering one pulls it up a touch. Mobile: copy first, cascade below.
// =============================================================================

// Diagonal cascade pose per card (left/top as % of the stack box, rotation).
const POSES = [
  { lx: 4, ly: 0, rot: -9 },
  { lx: 9, ly: 16, rot: -6 },
  { lx: 12, ly: 32, rot: -3 },
  { lx: 8, ly: 47, rot: 1 },
  { lx: 2, ly: 61, rot: 5 },
];

// Ordered top → bottom; the flagship (teal Manufacturing) anchors the front.
const BUDGETS: { slug: string; name: string; color: CapitalColor; amount: number }[] = [
  { slug: 'other', name: 'Other', color: 'obsidian', amount: 7000 },
  { slug: 'photoshoot', name: 'Photoshoot', color: 'copper', amount: 60000 },
  { slug: 'pr-campaign', name: 'PR Campaign', color: 'silver', amount: 80000 },
  { slug: 'ads', name: 'Ads', color: 'obsidian', amount: 120000 },
  { slug: 'manufacturing', name: 'Manufacturing', color: 'teal', amount: 300000 },
];

const EYEBROW = 'CAPITAL, ORGANIZED';
const HEADLINE = 'Every pound has a job.';
const BODY =
  'Ivy splits your capital across manufacturing, ads, shoots, PR and fulfillment—so nothing disappears into "business expenses."';

export default function BudgetsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} data-agent="ivy" data-in={inView || undefined} className="bud">
      <div className="bud-wrap">
        {/* COPY — left on desktop, first on mobile */}
        <div className="bud-copy">
          <div className="bud-eyebrow">{EYEBROW}</div>
          <h2 className="bud-headline">{HEADLINE}</h2>
          <p className="bud-body">{BODY}</p>
        </div>

        {/* CARDS — right on desktop, below the copy on mobile */}
        <div className="bud-cards-col">
          <div className="bud-stack">
            {BUDGETS.map((b, i) => {
              const pose = POSES[i];
              return (
                <div
                  key={b.slug}
                  className="bud-slot"
                  style={{
                    ['--lx' as string]: `${pose.lx}%`,
                    ['--ly' as string]: `${pose.ly}%`,
                    ['--rot' as string]: `${pose.rot}deg`,
                    ['--d' as string]: `${i * 0.08}s`,
                    ['--z' as string]: `${i + 1}`,
                  }}
                >
                  <div className="bud-reveal">
                    <CapitalCard
                      name={b.name}
                      color={b.color}
                      injected={b.amount}
                      balance={b.amount}
                      digits={cardDigits(b.slug)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .bud {
          padding: clamp(5rem, 12vw, 9rem) 1.5rem;
        }
        .bud-wrap {
          max-width: 1120px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(3rem, 7vw, 4.5rem);
        }

        /* ── Copy ── */
        .bud-copy {
          width: 100%;
          max-width: 520px;
          text-align: center;
        }
        .bud-eyebrow {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--text-tertiary);
          margin-bottom: 1.3rem;
        }
        .bud-headline {
          font-size: clamp(2rem, 5vw, 3.4rem);
          font-weight: 300;
          letter-spacing: -0.035em;
          line-height: 1.06;
          color: var(--text-primary);
        }
        .bud-body {
          font-size: 0.98rem;
          font-weight: 300;
          line-height: 1.75;
          color: var(--text-secondary);
          margin: 1.4rem auto 0;
          max-width: 460px;
        }

        /* ── The diagonal cascade ── */
        .bud-cards-col {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .bud-stack {
          position: relative;
          width: 100%;
          max-width: 440px;
          aspect-ratio: 0.7 / 1;
        }
        .bud-slot {
          position: absolute;
          width: 80%;
          left: var(--lx);
          top: var(--ly);
          border-radius: 16px;
          transform: rotate(var(--rot));
          transform-origin: center;
          z-index: var(--z);
          transition:
            transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }
        /* the scroll reveal lives on an inner layer, off the rotate/hover transform */
        .bud-reveal {
          opacity: 0;
          transform: translateY(24px) scale(0.96);
          transition:
            opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) var(--d),
            transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) var(--d);
        }
        .bud[data-in] .bud-reveal {
          opacity: 1;
          transform: none;
        }

        /* ── Desktop: copy left, cards right ── */
        @media (min-width: 1024px) {
          .bud-wrap {
            flex-direction: row;
            align-items: center;
            gap: clamp(3rem, 6vw, 6rem);
          }
          .bud-copy {
            width: 46%;
            text-align: left;
            margin: 0;
          }
          .bud-body {
            margin-left: 0;
            margin-right: 0;
          }
          .bud-cards-col {
            width: 54%;
          }
        }

        /* ── Hover: a small pull, real pointers only ── */
        @media (hover: hover) and (pointer: fine) {
          .bud-slot:hover {
            z-index: 50;
            transform: rotate(var(--rot)) translateY(-12px);
            box-shadow: 0 30px 54px rgba(0, 0, 0, 0.4);
          }
        }

        /* ── Reduced motion: static cascade ── */
        @media (prefers-reduced-motion: reduce) {
          .bud-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .bud-slot {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
