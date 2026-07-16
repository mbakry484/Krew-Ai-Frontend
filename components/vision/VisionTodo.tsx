'use client';

import { useEffect, useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { VISION_TODO } from '@/content/vision-copy';

// =============================================================================
// THE "TODAY" LIST (/about/vision) — "Founders should build. Agents should
// operate.", shown not stated (COPY.md "The Declaration → Today list").
//
// One photographic iPhone frame (`/vision/iphone-frame.webp` — cropped to the
// phone's bounding box, transparent, status bar baked in, body bleeding off the
// image bottom) with a coded "Today" list composited on its black screen. A
// single day mixes busywork and real work; as you scroll the pinned section, a
// line DRAWS through the `handled` tasks and dims them, leaving what matters.
//
// Scroll-scrubbed: `useScroll` writes `--p` (0→1) on the section and each
// handled row's strike scales L→R across its own sub-window of `--p` — pure
// CSS calc, no per-frame React re-render. BOTH views pin — the frame must
// freeze while the strikes draw. Desktop: cut-bottom frame bleeds off the
// viewport edge. Mobile: the complete frame (`iphone-frame-mob.webp`, real
// bottom bezel) sits under the copy, its lower half viewport-clipped during
// the pin. prefers-reduced-motion: no pin, `--p` forced to 1 — resolved,
// static.
//
// ⚠ Two hard-won rules for this file:
//   1. Keep ALL phone markup inline in this component's return — styled-jsx
//      does not scope JSX factored into variables/child components.
//   2. Keep the <style jsx> block interpolation-free (${…} broke style
//      emission on this page twice). Knobs flow in as CSS vars via the
//      section's inline style instead.
// =============================================================================

// ── KNOBS — the coded screen's fit inside the photographic frames ────────────
// Desktop frame `iphone-frame.webp` (826×1000, bottom cut off — hidden by the
// viewport edge): glass 2.7%→97.9% wide, top 1.6%, status bar ends ~14% down.
// Mobile frame `iphone-frame-mob.webp` (643×1359, COMPLETE phone with bottom
// bezel — no pin, no bleed): status bar ends ~7% down, glass bottom at ~99%.
const PHONE_W = 'min(clamp(340px, 40vw, 600px), 68vh)'; // desktop phone width (68vh cap keeps the status bar on short viewports)
const SCREEN_LEFT = '9%'; // content inset from the frame's left edge (both frames)
const SCREEN_RIGHT = '9%';
const SCREEN_TOP = '18%'; // desktop: below the baked status bar
const SCREEN_BOTTOM = '0%'; // desktop: screen bleeds off the image bottom
const PHONE_BLEED = '4%'; // desktop: how much of the cut bottom hangs off-viewport
const M_SCREEN_TOP = '10%'; // mobile frame: below its baked status bar
const M_SCREEN_BOTTOM = '5%'; // mobile frame: stop above the bottom bezel
// ─────────────────────────────────────────────────────────────────────────────

export default function VisionTodo() {
  const { headline, body, screenTitle, screenSubtitle, tasks } = VISION_TODO;

  const ref = useRef<HTMLElement>(null);
  const reducedRef = useRef(false);
  const [reduced, setReduced] = useState(false);

  // Assign each handled row a sub-window of --p so the strikes draw in sequence.
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
    if (!reducedRef.current) ref.current?.style.setProperty('--p', String(p));
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reducedRef.current = mq.matches;
      setReduced(mq.matches);
      if (mq.matches) ref.current?.style.setProperty('--p', '1');
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return (
    <section
      ref={ref}
      className="vt"
      data-static={reduced || undefined}
      style={
        {
          '--phw-base': PHONE_W,
          '--scr-l': SCREEN_LEFT,
          '--scr-r': SCREEN_RIGHT,
          '--scr-t-d': SCREEN_TOP,
          '--scr-b-d': SCREEN_BOTTOM,
          '--scr-t-m': M_SCREEN_TOP,
          '--scr-b-m': M_SCREEN_BOTTOM,
          '--bleed': PHONE_BLEED,
        } as React.CSSProperties
      }
    >
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

          {/* phone markup stays INLINE — see rule 1 in the header */}
          <div className="phone">
            <picture>
              <source media="(max-width: 820px)" srcSet="/vision/iphone-frame-mob.webp" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="phone-frame"
                src="/vision/iphone-frame.webp"
                alt=""
                draggable={false}
              />
            </picture>
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
        </div>
      </div>

      <style jsx>{`
        .vt {
          --p: 0;
          --phw: var(--phw-base);
          --scr-t: var(--scr-t-d);
          --scr-b: var(--scr-b-d);
          position: relative;
          height: 260vh;
        }
        .vt-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
        }
        .vt-inner {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          height: 100%;
          gap: clamp(2rem, 5vw, 4.5rem);
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* ── Copy (vertically centered; phone is bottom-anchored) ── */
        .vt-copy {
          padding-top: 2rem; /* fixed-nav clearance when the viewport is short */
        }
        .vt-headline {
          font-size: clamp(2.2rem, 4.4vw, 3.8rem);
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

        /* ── Phone: photographic frame + coded screen ──
           Bottom-anchored, cut edge pushed off-viewport; all screen type is em
           off a font-size derived from the phone width, so the list scales
           with the frame. */
        .phone {
          position: relative;
          width: var(--phw);
          align-self: end;
          transform: translateY(var(--bleed));
        }
        .phone-frame {
          display: block;
          width: 100%;
          height: auto;
          pointer-events: none;
          user-select: none;
        }
        .screen {
          position: absolute;
          left: var(--scr-l);
          right: var(--scr-r);
          top: var(--scr-t);
          bottom: var(--scr-b);
          overflow: hidden;
          font-size: calc(var(--phw) * 0.04);
        }
        .scr-title {
          font-size: 1.5em;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: rgba(255, 255, 255, 0.98);
        }
        .scr-sub {
          margin-top: 0.2em;
          font-size: 0.68em;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.42);
        }
        .scr-list {
          margin-top: 0.9em;
          list-style: none;
          padding: 0;
        }

        .row {
          display: flex;
          align-items: center;
          gap: 0.6em;
          padding: 0.62em 0;
          border-top: 0.5px solid rgba(255, 255, 255, 0.09);
        }
        .row:first-child {
          border-top: none;
        }
        .row-box {
          flex: none;
          width: 1em;
          height: 1em;
          border-radius: 0.32em;
          border: 1.4px solid rgba(255, 255, 255, 0.3);
        }
        .row-text {
          position: relative;
          font-size: 0.78em;
          font-weight: 400;
          line-height: 1.25;
          color: rgba(255, 255, 255, 0.9);
        }

        /* ── The strike, drawn L→R across each handled row's window of --p ── */
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
          left: -0.1em;
          right: -0.1em;
          top: 54%;
          height: 1.5px;
          background: rgba(255, 255, 255, 0.7);
          transform: scaleX(var(--s));
          transform-origin: left;
        }

        /* ── Mobile: PINNED like desktop — the frame must freeze while the
           strikes draw (unpinned, you scrolled away before the animation).
           Copy top, complete phone under it; the phone's lower half is
           viewport-clipped during the pin, which reads as intentional since
           the list lives in the top half. ── */
        @media (max-width: 820px) {
          .vt {
            --phw: min(84vw, 380px);
            --scr-t: var(--scr-t-m);
            --scr-b: var(--scr-b-m);
            height: 240vh;
          }
          .vt-inner {
            grid-template-columns: 1fr;
            align-content: start;
            justify-items: center;
            text-align: center;
            gap: 1.2rem;
            padding: 0 1.4rem;
          }
          .vt-copy {
            align-self: start;
            padding-top: 5.5rem; /* clear the fixed navbar */
          }
          .vt-body {
            margin-left: auto;
            margin-right: auto;
          }
          .phone {
            align-self: start;
            transform: none;
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
            padding: 3rem 0 0;
          }
          .phone {
            transform: none;
          }
        }
        .vt[data-static] {
          height: auto;
        }
        .vt[data-static] .vt-sticky {
          position: static;
          height: auto;
          padding: 3rem 0 0;
        }
        .vt[data-static] .phone {
          transform: none;
        }
      `}</style>
    </section>
  );
}
