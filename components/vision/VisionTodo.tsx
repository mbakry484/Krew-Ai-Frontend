'use client';

import { useEffect, useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { VISION_TODO } from '@/content/vision-copy';

// =============================================================================
// THE "TODAY" LIST (/about/vision) — "Founders should build. Agents should
// operate.", shown not stated (COPY.md "The Declaration → Today list").
//
// One photographic iPhone frame (`/vision/iphone-frame.webp`, transparent PNG→
// WebP, status bar baked in, screen bleeds off the bottom) with a coded "Today"
// list composited onto its black screen. A single day mixes busywork and real
// work; as you scroll the section, a line DRAWS through the tasks the crew
// handles (`handled`), dimming them, and leaves the ones that matter clean.
//
// Scroll-scrubbed: the pinned phone holds while `--p` (0→1) advances with scroll
// and each handled row's strike scales L→R across its own scroll sub-window
// (pure CSS calc off `--p`, no per-frame React re-render). prefers-reduced-
// motion: no pin, `--p` pinned to 1 — the resolved list, static.
//
// SCREEN_* are the coded overlay's insets over the photo (measured: inner screen
// 18.4–81.2% wide, 21.5% down; SCREEN_TOP clears the baked status bar). Tune
// these if the overlay ever drifts against the frame — same idea as Hero.tsx.
// =============================================================================

// ── KNOBS — the coded screen's fit inside the photographic frame ─────────────
const SCREEN_LEFT = '19%';
const SCREEN_RIGHT = '19%';
const SCREEN_TOP = '30%'; // below the baked status bar
const PHONE_W = 'clamp(260px, 30vw, 355px)';
// ─────────────────────────────────────────────────────────────────────────────

export default function VisionTodo() {
  const { headline, body, screenTitle, screenSubtitle, tasks } = VISION_TODO;

  const ref = useRef<HTMLElement>(null);
  const [reduced, setReduced] = useState(false);

  // Assign each handled row a scroll sub-window so the strikes draw in sequence.
  const handledCount = tasks.filter((t) => t.handled).length;
  let handledSeen = 0;
  const rows = tasks.map((t) => {
    if (!t.handled) return { ...t, start: 0, len: 1 };
    const gi = handledSeen++;
    const span = 0.8 / handledCount;
    return { ...t, start: 0.1 + gi * span, len: span * 0.9 };
  });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    ref.current?.style.setProperty('--p', String(p));
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setReduced(mq.matches);
      if (mq.matches) ref.current?.style.setProperty('--p', '1');
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const phone = (
    <div className="phone">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="phone-frame" src="/vision/iphone-frame.webp" alt="" draggable={false} />
      <div className="screen">
        <h3 className="scr-title">{screenTitle}</h3>
        <p className="scr-sub">{screenSubtitle}</p>
        <ul className="scr-list">
          {rows.map((r, i) => (
            <li
              key={r.text}
              className={r.handled ? 'row handled' : 'row'}
              style={
                r.handled
                  ? ({ '--start': r.start, '--len': r.len } as React.CSSProperties)
                  : undefined
              }
            >
              <span className="row-box" aria-hidden="true" />
              <span className="row-text">
                {i + 1}. {r.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <section ref={ref} className="vt" data-static={reduced || undefined}>
      <div className="vt-sticky">
        <div className="vt-inner">
          <div className="vt-copy">
            <h2 className="vt-headline">
              {headline[0]}
              <br />
              {headline[1]}
            </h2>
            <p className="vt-body">{body}</p>
          </div>
          {phone}
        </div>
      </div>

      <style jsx>{`
        .vt {
          --p: 0;
          position: relative;
          height: 260vh;
        }
        .vt-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .vt-inner {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: clamp(2rem, 6vw, 5.5rem);
          max-width: 1100px;
          width: 100%;
          padding: 0 2rem;
        }

        /* ── Copy ── */
        .vt-headline {
          font-size: clamp(2.2rem, 4.6vw, 3.9rem);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: var(--text-primary);
        }
        .vt-body {
          margin-top: 1.6rem;
          max-width: 440px;
          font-size: clamp(0.95rem, 1.3vw, 1.12rem);
          font-weight: 300;
          line-height: 1.75;
          color: var(--text-secondary);
        }

        /* ── Phone: photographic frame + coded screen ── */
        .phone {
          position: relative;
          flex: none;
          width: ${PHONE_W};
        }
        .phone-frame {
          display: block;
          width: 100%;
          height: auto;
          pointer-events: none;
        }
        .screen {
          position: absolute;
          left: ${SCREEN_LEFT};
          right: ${SCREEN_RIGHT};
          top: ${SCREEN_TOP};
          bottom: 0;
          overflow: hidden;
          /* the screen is pure black in the photo — content sits directly on it */
        }
        .scr-title {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: rgba(255, 255, 255, 0.98);
        }
        .scr-sub {
          margin-top: 0.15rem;
          font-size: 0.66rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.42);
        }
        .scr-list {
          margin-top: 0.7rem;
          list-style: none;
        }

        .row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.5rem 0;
          border-top: 0.5px solid rgba(255, 255, 255, 0.09);
        }
        .row:first-child {
          border-top: none;
        }
        .row-box {
          flex: none;
          width: 15px;
          height: 15px;
          border-radius: 5px;
          border: 1.4px solid rgba(255, 255, 255, 0.3);
        }
        .row-text {
          position: relative;
          font-size: 0.74rem;
          font-weight: 400;
          line-height: 1.25;
          color: rgba(255, 255, 255, 0.9);
        }

        /* ── The strike, drawn L→R across each handled row's scroll window ──
           --s is a 0→1 progress clamped to this row's [start, start+len]. */
        .row.handled {
          --s: clamp(0, calc((var(--p) - var(--start)) / var(--len)), 1);
        }
        .row.handled .row-text {
          color: rgba(255, 255, 255, calc(0.9 - 0.58 * var(--s)));
        }
        .row.handled .row-box {
          border-color: rgba(255, 255, 255, calc(0.3 - 0.14 * var(--s)));
        }
        .row.handled .row-text::after {
          content: '';
          position: absolute;
          left: -1px;
          right: -1px;
          top: 54%;
          height: 1.5px;
          background: rgba(255, 255, 255, 0.7);
          transform: scaleX(var(--s));
          transform-origin: left;
        }

        /* ── Mobile: still pinned, stacked — copy above, phone below ── */
        @media (max-width: 820px) {
          .vt {
            height: 240vh;
          }
          .vt-inner {
            grid-template-columns: 1fr;
            justify-items: center;
            text-align: center;
            gap: 1.8rem;
            padding: 0 1.4rem;
          }
          .vt-body {
            margin-left: auto;
            margin-right: auto;
          }
          .phone {
            width: min(74vw, 300px);
          }
        }

        /* ── Reduced motion: no pin, resolved state, static ── */
        @media (prefers-reduced-motion: reduce) {
          .vt {
            height: auto;
          }
          .vt-sticky {
            position: static;
            height: auto;
            padding: 1rem 0;
          }
        }
        .vt[data-static] {
          height: auto;
        }
        .vt[data-static] .vt-sticky {
          position: static;
          height: auto;
          padding: 1rem 0;
        }
      `}</style>
    </section>
  );
}
