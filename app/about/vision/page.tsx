'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Intersection-observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Generic scroll-fade wrapper ──────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(22px)',
      transition: `opacity 0.65s ease-out ${delay}ms, transform 0.65s ease-out ${delay}ms`,
      willChange: 'opacity, transform',
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-[0.5px] bg-border" />;
}

// ─── Brand positioning spectrum (Fix 1 — clean draw animation, no glow) ──────
const AXES = [
  { left: 'MANUAL',          right: 'AUTOMATED',   krewX: 0.80, peers: [0.22, 0.44, 0.50] },
  { left: 'REACTIVE',        right: 'PROACTIVE',   krewX: 0.73, peers: [0.30, 0.55] },
  { left: 'SLOW',            right: 'INSTANT',     krewX: 0.86, peers: [0.18, 0.40, 0.48] },
  { left: 'CLOSED',          right: 'TRANSPARENT', krewX: 0.76, peers: [0.35, 0.58] },
  { left: 'HUMAN-DEPENDENT', right: 'AI-POWERED',  krewX: 0.82, peers: [0.26, 0.46, 0.60] },
];

function SpectrumGraphic() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const connectRef = useRef<SVGPathElement>(null);
  const [triggered, setTriggered] = useState(false);
  const [pathLen, setPathLen] = useState(600); // fallback; measured on mount

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTriggered(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (connectRef.current) setPathLen(connectRef.current.getTotalLength());
  }, []);

  const W = 400, H = 300;
  const PAD_L = 130, PAD_R = 24, PAD_T = 28, PAD_B = 28;
  const trackW = W - PAD_L - PAD_R;
  const rowH = (H - PAD_T - PAD_B) / (AXES.length - 1);

  const krewPts = AXES.map((ax, i) => ({
    x: PAD_L + ax.krewX * trackW,
    y: PAD_T + i * rowH,
  }));

  // Simple polyline path (no bezier — clean sharp line)
  const connectPath = krewPts
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  // Timing (ms)
  const LINE_DUR   = 500;   // each line draws over 500ms
  const LINE_STAG  = 200;   // stagger between lines
  const DOT_DELAY  = (i: number) => i * LINE_STAG + LINE_DUR + 50;  // after its line finishes
  const DOT_DUR    = 200;
  const CONN_START = (AXES.length - 1) * LINE_STAG + LINE_DUR + DOT_DUR + 100; // after last dot

  return (
    <div ref={wrapRef} style={{ opacity: triggered ? 1 : 0, transition: 'opacity 0.4s ease-out 80ms' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxWidth: '480px', display: 'block', overflow: 'visible' }}
        aria-hidden
      >
        {AXES.map((ax, i) => {
          const y = PAD_T + i * rowH;
          const dotX = PAD_L + ax.krewX * trackW;
          const lineStart = i * LINE_STAG;
          const dotStart = DOT_DELAY(i);

          return (
            <g key={ax.left}>
              {/* Axis line — draws left to right */}
              <line
                x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                stroke="var(--border-md, rgba(120,120,120,0.22))"
                strokeWidth="1"
                strokeDasharray={trackW}
                strokeDashoffset={triggered ? 0 : trackW}
                style={{ transition: `stroke-dashoffset ${LINE_DUR}ms ease-out ${lineStart}ms` }}
              />

              {/* Labels — fade in with the line */}
              <text
                x={PAD_L - 10} y={y + 4} textAnchor="end"
                fontSize="8.5" letterSpacing="0.08em"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
                fill="var(--text-tertiary)"
                style={{ opacity: triggered ? 1 : 0, transition: `opacity 0.3s ease-out ${lineStart + 200}ms` }}
              >
                {ax.left}
              </text>
              <text
                x={W - PAD_R + 10} y={y + 4} textAnchor="start"
                fontSize="8.5" letterSpacing="0.08em"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
                fill="var(--text-tertiary)"
                style={{ opacity: triggered ? 1 : 0, transition: `opacity 0.3s ease-out ${lineStart + 200}ms` }}
              >
                {ax.right}
              </text>

              {/* Industry-average dots — appear with Krew dot, 30% opacity */}
              {ax.peers.map((px, pi) => (
                <circle
                  key={pi}
                  cx={PAD_L + px * trackW} cy={y} r="2.5"
                  fill="var(--text-primary)"
                  style={{
                    opacity: triggered ? 0.3 : 0,
                    transition: `opacity 0.2s ease-out ${dotStart + pi * 25}ms`,
                  }}
                />
              ))}

              {/* Krew dot — scale in after its line finishes */}
              <g transform={`translate(${dotX.toFixed(1)}, ${y.toFixed(1)})`}>
                <circle
                  cx={0} cy={0} r="6.5"
                  fill="var(--text-primary)"
                  style={{
                    transform: triggered ? 'scale(1)' : 'scale(0)',
                    transformOrigin: '0 0',
                    transition: `transform ${DOT_DUR}ms ease-out ${dotStart}ms`,
                  }}
                />
              </g>
            </g>
          );
        })}

        {/* Connecting polyline — draws after all dots */}
        <path
          ref={connectRef}
          d={connectPath}
          fill="none"
          stroke="var(--text-secondary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLen}
          strokeDashoffset={triggered ? 0 : pathLen}
          style={{ transition: `stroke-dashoffset 0.8s ease-out ${CONN_START}ms` }}
        />

        {/* Legend */}
        <g style={{ opacity: triggered ? 1 : 0, transition: `opacity 0.4s ease-out ${CONN_START + 600}ms` }}>
          <g transform={`translate(${PAD_L}, ${H - 2})`}>
            <circle cx={0} cy={0} r="4" fill="var(--text-primary)" />
          </g>
          <text x={PAD_L + 10} y={H + 1} fontSize="8" letterSpacing="0.06em"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
            fill="var(--text-tertiary)">KREW</text>
          <circle cx={PAD_L + 60} cy={H - 2} r="2.5" fill="var(--text-primary)" opacity="0.3" />
          <text x={PAD_L + 70} y={H + 1} fontSize="8" letterSpacing="0.06em"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
            fill="var(--text-tertiary)">INDUSTRY AVG</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Wove arc navigator (Fix 2 — controlled by scroll, no timer) ──────────────
const PROBLEMS = [
  {
    num: '01',
    heading: 'Answering the same DMs at midnight.',
    sub: 'The same questions, every day. Each one pulls a founder away from the work that actually builds the brand.',
  },
  {
    num: '02',
    heading: 'Chasing order updates manually.',
    sub: 'Customers expect instant answers. Every delay is a lost order or a damaged relationship.',
  },
  {
    num: '03',
    heading: 'Logging returns and refund requests by hand.',
    sub: 'Spreadsheets. Screenshots in group chats. The operational layer consumes everything from the inside.',
  },
  {
    num: '04',
    heading: "We're changing that.",
    sub: "Krew replaces the busywork with agents that run 24/7 — always on, always accurate.",
    payoff: true,
  },
];

const ARC_H     = 480;
const ARC_W     = 520;
const CIRCLE_R  = 560;
const CIRCLE_CX = ARC_W + 180;
const CIRCLE_CY = ARC_H / 2;
const STEP      = 112;

function arcX(y: number): number {
  const dy   = y - CIRCLE_CY;
  const disc = CIRCLE_R * CIRCLE_R - dy * dy;
  return CIRCLE_CX - Math.sqrt(Math.max(0, disc));
}

function WoveArc({ active, visible }: { active: number; visible: boolean }) {
  const arcPathD = Array.from({ length: 41 }, (_, idx) => {
    const y = (ARC_H * idx) / 40;
    return `${idx === 0 ? 'M' : 'L'} ${arcX(y).toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div style={{ position: 'relative', width: ARC_W, height: ARC_H, overflow: 'hidden', flexShrink: 0 }}>
      {/* Thin arc structural line */}
      <svg
        viewBox={`0 0 ${ARC_W} ${ARC_H}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
        aria-hidden
      >
        <path d={arcPathD} fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.28" />
      </svg>

      {/* Items */}
      {PROBLEMS.map((item, i) => {
        const dist     = i - active;
        const absDist  = Math.abs(dist);
        const itemY    = CIRCLE_CY + dist * STEP;
        const itemX    = arcX(itemY);
        const onScreen = itemY >= -80 && itemY <= ARC_H + 80;

        const numSize   = absDist === 0 ? 72 : absDist === 1 ? 46 : 34;
        const numWeight = absDist === 0 ? 500 : 300;
        const itemOpacity = !visible ? 0 : !onScreen ? 0 : absDist === 0 ? 1 : absDist === 1 ? 0.28 : 0.12;
        const isActive  = absDist === 0;

        // Anchor: number vertically centered at itemY
        const translateX = (itemX - 10).toFixed(1);
        const translateY = (itemY - numSize / 2).toFixed(1);

        return (
          <div
            key={item.num}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate(${translateX}px, ${translateY}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              opacity: itemOpacity,
              transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.45s ease',
              pointerEvents: 'none',
            }}
          >
            {/* Indicator dot */}
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--text-primary)',
              flexShrink: 0,
              opacity: isActive ? 1 : 0,
              transition: isActive ? 'opacity 0.3s ease 0.4s' : 'opacity 0.15s ease',
            }} />

            {/* Number */}
            <span style={{
              fontSize: numSize,
              fontWeight: numWeight,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
              color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
              transition: 'font-size 0.55s cubic-bezier(0.4,0,0.2,1), color 0.4s ease',
            }}>
              {item.num}
            </span>

            {/* Label — to the right of the number, fades in when active */}
            <div style={{
              maxWidth: 220,
              opacity: isActive ? 1 : 0,
              transition: isActive ? 'opacity 0.4s ease 0.45s' : 'opacity 0.15s ease',
            }}>
              <p style={{
                margin: 0,
                fontSize: item.payoff ? '1.15rem' : '1rem',
                fontWeight: item.payoff ? 600 : 500,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
                marginBottom: 8,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
              }}>
                {item.heading}
              </p>
              <p style={{
                margin: 0,
                fontSize: '0.82rem',
                fontWeight: 300,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
              }}>
                {item.sub}
              </p>
            </div>
          </div>
        );
      })}

      {/* Progress indicator */}
      <div style={{
        position: 'absolute',
        bottom: 18,
        left: arcX(ARC_H - 18) + 4,
        display: 'flex',
        gap: 5,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease 0.3s',
      }}>
        {PROBLEMS.map((_, i) => (
          <span key={i} style={{
            height: 4,
            width: i === active ? 20 : 4,
            borderRadius: 2,
            background: i === active ? 'var(--text-primary)' : 'var(--border-md, rgba(128,128,128,0.28))',
            transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1), background 0.3s ease',
            display: 'block',
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VisionPage() {
  const [problemActive, setProblemActive]   = useState(0);
  const [problemVisible, setProblemVisible] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect          = el.getBoundingClientRect();
      const scrollable    = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const scrolledPast  = -rect.top;
      const progress      = Math.max(0, Math.min(1, scrolledPast / scrollable));
      setProblemActive(Math.min(3, Math.floor(progress * 4)));
      // Mark visible once we've started scrolling into the section
      if (scrolledPast > -window.innerHeight * 0.5) setProblemVisible(true);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on mount in case section is already in view
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <section className="pt-36 pb-28 px-8 max-w-[1100px] mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <Reveal>
              <p className="text-[0.6rem] uppercase tracking-[0.18em] text-text-tertiary mb-10">
                Krew — Our Vision
              </p>
            </Reveal>
            <Reveal delay={70}>
              <h1 className="text-[clamp(2.6rem,4.8vw,5rem)] leading-[1.04] tracking-[-0.04em] text-text-primary mb-9">
                <span className="font-light block">Your brand runs.</span>
                <span className="font-bold block">We handle the rest.</span>
              </h1>
            </Reveal>
            <Reveal delay={150}>
              <p className="text-[0.9rem] text-text-secondary font-light leading-[1.9] max-w-[400px]">
                Krew builds AI agents that take over the operational work behind running a brand —
                so founders can focus on what actually matters.
              </p>
            </Reveal>
          </div>
          <div className="hidden md:flex items-center justify-end pr-4">
            <SpectrumGraphic />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 1 — THE PROBLEM (scroll-jacked) ── */}
      <section>
        {/* Section label — scrolls normally above the sticky panel */}
        <div className="px-8 max-w-[1100px] mx-auto pt-28 pb-10">
          <Reveal>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-text-tertiary">
              The problem we solve
            </p>
          </Reveal>
        </div>

        {/* 400vh tall wrapper drives the scroll */}
        <div ref={wrapRef} style={{ height: '400vh', position: 'relative' }}>
          {/* Sticky panel — 100vh, centered content */}
          <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
            <div
              className="flex gap-16 items-center h-full px-8 max-w-[1100px] mx-auto max-md:flex-col max-md:justify-center"
            >
              {/* Left — sticky headline (naturally stays put since it's inside the sticky panel) */}
              <div className="md:w-[40%] shrink-0">
                <div className="pl-7" style={{ borderLeft: '2px solid var(--text-primary)' }}>
                  <h2 className="text-[clamp(1.4rem,2.4vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.2] text-text-primary">
                    For too long, brand owners have been buried in the work of running their brand.
                  </h2>
                </div>
              </div>

              {/* Right — arc navigator, controlled by scroll */}
              <div className="md:w-[55%] hidden md:flex items-center justify-center">
                <WoveArc active={problemActive} visible={problemVisible} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 2 — EDITORIAL QUOTE ── */}
      <section className="py-28 px-8 max-w-[1100px] mx-auto">
        <Reveal>
          <p className="text-[0.6rem] uppercase tracking-[0.14em] text-text-tertiary mb-12">
            What we believe
          </p>
        </Reveal>
        <Reveal delay={80}>
          <blockquote className="text-[clamp(1.4rem,2.8vw,2.65rem)] font-light tracking-[-0.025em] leading-[1.38] text-text-primary max-w-[860px]">
            "The best-run brands shouldn't require a team of ten to operate.
            They should require the right agents."
          </blockquote>
        </Reveal>
      </section>

      <Divider />

      {/* ── SECTION 3 — MISSION + VISION ── */}
      <section className="py-28 px-8 max-w-[1100px] mx-auto">
        <Reveal>
          <p className="text-[0.6rem] uppercase tracking-[0.14em] text-text-tertiary mb-16">
            Mission &amp; Vision
          </p>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-x-20 gap-y-16 items-start">
          <Reveal>
            <div>
              <p className="text-[0.58rem] uppercase tracking-[0.18em] text-text-tertiary mb-5">Mission</p>
              <p className="text-[0.87rem] text-text-secondary font-light leading-[1.95]">
                Krew's mission is to give every MENA brand owner an AI-powered operations team —
                starting with customer support, and expanding across every repetitive task that slows growth.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div>
              <p className="text-[0.58rem] uppercase tracking-[0.18em] text-text-tertiary mb-5">Vision</p>
              <p className="text-[0.87rem] text-text-secondary font-light leading-[1.95]">
                We envision a future where founders spend zero time on operational busywork.
                Where Luna handles your DMs, Ivy manages your finances, and your Krew runs in
                the background — always on, always accurate.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 4 — KREW AGENTS ROSTER ── */}
      <section className="py-28 px-8 max-w-[1100px] mx-auto">
        <Reveal>
          <p className="text-[0.6rem] uppercase tracking-[0.14em] text-text-tertiary mb-6">The Krew</p>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="text-[clamp(1.5rem,3vw,2.8rem)] font-light tracking-[-0.03em] leading-[1.2] text-text-primary mb-3 max-w-[580px]">
            One platform.<br />A growing family of agents.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="text-[0.84rem] text-text-secondary font-light leading-[1.9] max-w-[460px] mb-14">
            Luna is the first product under Krew. A pipeline of named, specialized agents is
            being built — each one covering a distinct layer of brand operations.
          </p>
        </Reveal>
        <div className="border-t border-border">
          {[
            { name: 'Luna', role: 'Customer Operations',    status: 'Live', live: true  },
            { name: 'Ivy',  role: 'Financial Visibility',   status: 'Soon', live: false },
            { name: '—',    role: 'Performance Reporting',  status: 'Soon', live: false },
            { name: '—',    role: 'Marketing Intelligence', status: 'Soon', live: false },
          ].map((agent, i) => (
            <Reveal key={agent.role} delay={i * 60}>
              <div className="flex items-center justify-between py-5 border-b border-border">
                <div className="flex items-center gap-4">
                  <span className={`text-[0.88rem] tracking-[-0.01em] ${agent.live ? 'text-text-primary' : 'text-text-tertiary'}`}>
                    {agent.name}
                  </span>
                  <span className={`text-[0.55rem] uppercase tracking-[0.07em] px-[7px] py-[2px] rounded border ${
                    agent.live ? 'border-[rgba(61,187,119,0.4)] text-[#3dbb77]' : 'border-border text-text-tertiary'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <span className={`text-[0.75rem] ${agent.live ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                  {agent.role}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── FOOTER ── */}
      <footer className="py-7 px-8 max-w-[960px] mx-auto flex items-center justify-between max-md:flex-col max-md:gap-2 max-md:text-center">
        <div className="text-[0.75rem] font-medium tracking-[0.07em] uppercase text-text-tertiary">Krew</div>
        <div className="text-[0.68rem] text-text-tertiary">Luna · Customer Operations Agent</div>
        <div className="text-[0.68rem] text-text-tertiary">© 2025 Krew. All rights reserved.</div>
      </footer>
    </div>
  );
}
