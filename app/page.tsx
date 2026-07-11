'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import Hero from '@/components/landing/Hero';
import CrewSection from '@/components/landing/CrewSection';
import SpotlightSection from '@/components/landing/SpotlightSection';
import ReliefSection from '@/components/landing/ReliefSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import Button from '@/components/Button';
import Footer from '@/components/Footer';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// This is a static landing page — no API calls required.
// Hero + crew reveal render from lib/agents.ts + content/agent-content.ts.
// =============================================================================

export default function LandingPage() {
  const { theme } = useTheme();
  const dk = theme === 'dark';

  // Why Luna: pinned sticky section — cards fly in based on scroll progress
  const whyRef = useRef<HTMLDivElement>(null);
  const [whyProgress, setWhyProgress] = useState(0);
  useEffect(() => {
    const el = whyRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const runway = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const p = runway > 0 ? Math.max(0, Math.min(1, scrolled / runway)) : 0;
      setWhyProgress(p);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  // How-it-works scenes: cursor-driven 3D tilt
  const handleSceneMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--tilt-rx', `${(-y * 12).toFixed(2)}deg`);
    el.style.setProperty('--tilt-ry', `${(x * 16).toFixed(2)}deg`);
    el.style.setProperty('--tilt-lift', '1');
  };
  const handleSceneLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.setProperty('--tilt-rx', '0deg');
    el.style.setProperty('--tilt-ry', '0deg');
    el.style.setProperty('--tilt-lift', '0');
  };

  return (
    <>
      <div id="landing" className="min-h-screen pt-20">

        {/* ── HERO — registry-driven, rotates with the live agent (Phase 2.1) ── */}
        <Hero />

        {/* ── CREW REVEAL — permanent brand layer (Phase 2.2) ── */}
        <CrewSection />

        {/* ── SPOTLIGHT — the live agent's main-character beat: the wedge,
              the return dial, a short team recap (Phase 2.3) ── */}
        <SpotlightSection />

        {/* ── FEATURES — 4-tab feature switcher, sits directly under the hero ── */}
        <FeaturesSection />

        {/* ── RELIEF BEAT — DMs pile up, then clear (landing-only, no data) ── */}
        <ReliefSection />

        {/* ── WHY LUNA — pinned scroll: minimal centered headline + cards flying in & tilting ── */}
        <div ref={whyRef} className="why-outer border-t border-b border-border bg-background">
          <div className="why-sticky">
            {/* minimal centered heading — matches site style */}
            <div className="why-center">
              <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">Why Luna</div>
              <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] mb-[0.9rem] text-text-primary">
                Why brands<br />choose Luna.
              </h2>
              <p className="text-[0.8rem] text-text-secondary leading-[1.8] max-w-[360px] font-light mx-auto">
                Five reasons Luna outperforms the generic chatbot your customers are tired of.
              </p>
            </div>

            {/* cards — positioned around the headline, fly in from the edges on scroll */}
            {(() => {
              const cards = [
                {
                  title: 'Built for MENA.',
                  body: "Arabic, Franco Arabic, Egyptian dialect. Luna speaks your customers' language naturally.",
                  pos:    { top: '10%',    left: '30%' },
                  start:  { x: 0,   y: -120, r: -10 },
                  end:    { x: 0,   y: 0,    r: 3 },
                },
                {
                  title: 'Zero response time.',
                  body: 'Every DM answered instantly, 24/7. No missed orders, no waiting customers.',
                  pos:    { top: '28%',    left: '3%'  },
                  start:  { x: -90, y: -20, r: -45 },
                  end:    { x: 0,   y: 0,   r: 12 },
                },
                {
                  title: 'Shopify-native.',
                  body: 'Checks stock, places orders, handles refunds — all inside the DM, automatically.',
                  pos:    { top: '20%',    right: '3%' },
                  start:  { x: 90,  y: -20, r: 45 },
                  end:    { x: 0,   y: 0,   r: -8 },
                },
                {
                  title: 'You stay in control.',
                  body: 'Luna knows when to step back. Escalation is instant, and nothing moves without your rules.',
                  pos:    { bottom: '12%', left: '7%' },
                  start:  { x: -90, y: 80,  r: 55 },
                  end:    { x: 0,   y: 0,   r: 7 },
                },
                {
                  title: 'Sounds like you.',
                  body: 'Tone, products, policies. Luna learns your brand voice and represents it — not a generic bot.',
                  pos:    { bottom: '8%',  right: '5%' },
                  start:  { x: 90,  y: 80,  r: -55 },
                  end:    { x: 0,   y: 0,   r: -11 },
                },
              ];

              const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
              const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

              return cards.map((c, i) => {
                const start = 0.05 + i * 0.11;
                const end   = start + 0.38;
                const raw   = (whyProgress - start) / (end - start);
                const p     = ease(Math.max(0, Math.min(1, raw)));

                const tx = lerp(c.start.x, c.end.x, p);
                const ty = lerp(c.start.y, c.end.y, p);
                const r  = lerp(c.start.r, c.end.r, p);
                const s  = lerp(0.82, 1, p);

                return (
                  <div
                    key={c.title}
                    className="why-card-v2 bg-background2 border border-border"
                    onMouseMove={handleSceneMove}
                    onMouseLeave={handleSceneLeave}
                    style={{
                      ...c.pos,
                      transform: `translate(${tx}vw, ${ty}vh) rotate(${r}deg) scale(${s})`,
                      opacity: p,
                      zIndex: 20 + i,
                    }}
                  >
                    <div className="why-card-inner">
                      <div className="text-[0.6rem] uppercase tracking-[0.12em] text-text-tertiary tabular-nums mb-[0.75rem]">
                        0{i + 1} / 05
                      </div>
                      <div className="text-[1rem] font-medium text-text-primary tracking-[-0.015em] mb-[0.55rem]">
                        {c.title}
                      </div>
                      <p className="text-[0.82rem] text-text-secondary leading-[1.7] font-light">
                        {c.body}
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* ── INTEGRATIONS STRIP ── */}
        <div className="border-t border-b border-border py-10 px-8 flex items-center justify-center gap-[0.6rem] flex-wrap">
          <span className="text-[0.62rem] uppercase tracking-[0.1em] text-text-tertiary mr-[0.8rem] whitespace-nowrap">Integrates with</span>

          {/* Instagram — monochrome mark in dark mode (gradient reserved), brand gradient in light */}
          <div className="integ-logo-item">
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
              <defs><linearGradient id="ig-g2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke={dk ? 'currentColor' : 'url(#ig-g2)'} strokeWidth="1.8"/>
              <circle cx="12" cy="12" r="4" stroke={dk ? 'currentColor' : 'url(#ig-g2)'} strokeWidth="1.8"/>
              <circle cx="17.5" cy="6.5" r="1" fill={dk ? 'currentColor' : 'url(#ig-g2)'}/>
            </svg>
            Instagram
          </div>

          {/* Facebook */}
          <div className="integ-logo-item">
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="#1877F2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: '#1877F2' }}>Facebook</span>
          </div>

          {/* Shopify */}
          <div className="integ-logo-item">
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
              <path d="M15.5 4.5s-.3-1.5-1.8-1.5c0 0-1.2.1-2.2 1.2" stroke="#96BF48" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M8 7.5l1 12 7.5 1.5 2.5-13.5-3-.5s-.4-2-2-2.5c0 0-1.8-.3-3 1L8 7.5z" stroke="#96BF48" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M10.5 7l.5 11M14 7.5l-1 10.5" stroke="#96BF48" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{ color: '#96BF48' }}>Shopify</span>
          </div>

          {/* Bosta */}
          <div className="integ-logo-item">
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="7" width="20" height="13" rx="2" stroke="#FF6B35" strokeWidth="1.8"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#FF6B35" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M12 12v3M10.5 13.5h3" stroke="#FF6B35" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span style={{ color: '#FF6B35' }}>Bosta</span>
          </div>
        </div>

        {/* How It Works — four steps */}
        <div className="py-44 px-8 max-w-[1080px] mx-auto" id="products">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">How it works</div>
          <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] max-w-[540px] mb-[0.9rem]">
            Four steps.<br />From setup to live in minutes.
          </h2>
          <p className="text-[0.8rem] text-text-secondary leading-[1.8] max-w-[460px] font-light mb-14">
            No code. No plugins. No engineering team needed.
          </p>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-24">

            {/* STEP 01 — Connect */}
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-[26px] h-[26px] rounded-full bg-btn-bg text-btn-text flex items-center justify-center text-[0.56rem] font-medium tabular-nums">01</div>
                <div className="flex-1 h-[1px] bg-border" />
              </div>
              <h3 className="text-[0.92rem] font-medium text-text-primary mb-[0.4rem] tracking-[-0.01em]">Connect your stack.</h3>
              <p className="text-[0.76rem] text-text-secondary leading-[1.75] font-light max-w-[340px] mb-6">
                Link Instagram and Shopify in under two minutes. Luna reads your catalog and starts learning instantly.
              </p>
              <div className="step-scene" onMouseMove={handleSceneMove} onMouseLeave={handleSceneLeave}>
                <div className="step-scene-glow" />
                <div className="scene-stage">
                {/* IG card — top-left, tilted */}
                <div className="scene-card" style={{ top: '8%', left: '4%', width: '58%', transform: 'perspective(900px) rotateX(10deg) rotateY(-14deg) rotateZ(-4deg)' }}>
                  <div className="flex items-center gap-[0.6rem] p-[0.7rem]">
                    <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: dk ? '#232327' : 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
                      <svg className="w-[13px] h-[13px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.68rem] font-medium text-text-primary leading-tight">Instagram</div>
                      <div className="text-[0.5rem] text-text-tertiary truncate">@yourbrand</div>
                    </div>
                  </div>
                  <div className="border-t border-border flex items-center gap-[5px] px-[0.7rem] py-[0.4rem]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#3dbb77]" />
                    <span className="text-[0.48rem] text-text-tertiary uppercase tracking-[0.1em]">Connected</span>
                  </div>
                </div>

                {/* Connecting dashed path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 320" preserveAspectRatio="none">
                  <path d="M 170 110 Q 220 170 260 220" stroke="var(--border-md)" strokeWidth="1.2" strokeDasharray="3 4" fill="none" />
                </svg>

                {/* Shopify card — bottom-right, tilted */}
                <div className="scene-card" style={{ bottom: '8%', right: '4%', width: '58%', transform: 'perspective(900px) rotateX(12deg) rotateY(10deg) rotateZ(3deg)' }}>
                  <div className="flex items-center gap-[0.6rem] p-[0.7rem]">
                    <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: '#96BF48' }}>
                      <svg className="w-[13px] h-[13px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M8 7.5l1 12 7.5 1.5 2.5-13.5-3-.5s-.4-2-2-2.5c0 0-1.8-.3-3 1L8 7.5z"/><path d="M10.5 7l.5 11M14 7.5l-1 10.5"/></svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.68rem] font-medium text-text-primary leading-tight">Shopify</div>
                      <div className="text-[0.5rem] text-text-tertiary truncate">yourbrand.myshopify.com</div>
                    </div>
                  </div>
                  <div className="border-t border-border flex items-center gap-[5px] px-[0.7rem] py-[0.4rem]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#3dbb77]" />
                    <span className="text-[0.48rem] text-text-tertiary uppercase tracking-[0.1em]">Connected</span>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* STEP 02 — Customize */}
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-[26px] h-[26px] rounded-full bg-btn-bg text-btn-text flex items-center justify-center text-[0.56rem] font-medium tabular-nums">02</div>
                <div className="flex-1 h-[1px] bg-border" />
              </div>
              <h3 className="text-[0.92rem] font-medium text-text-primary mb-[0.4rem] tracking-[-0.01em]">Make it yours.</h3>
              <p className="text-[0.76rem] text-text-secondary leading-[1.75] font-light max-w-[340px] mb-6">
                Upload your policies, shape Luna's tone, and add the details only your brand knows.
              </p>
              <div className="step-scene" onMouseMove={handleSceneMove} onMouseLeave={handleSceneLeave}>
                <div className="step-scene-glow" />
                <div className="scene-stage">
                {/* Knowledge base table — tilted (matches real dashboard UI) */}
                <div className="scene-card" style={{ top: '10%', left: '4%', width: '92%', transform: 'perspective(1000px) rotateX(12deg) rotateY(-10deg) rotateZ(-2deg)' }}>
                  {/* column headers */}
                  <div className="grid grid-cols-[58%_42%] border-b border-border text-[0.44rem] uppercase tracking-[0.14em] text-text-tertiary bg-background2">
                    <div className="px-[0.7rem] py-[0.45rem]">Question</div>
                    <div className="px-[0.7rem] py-[0.45rem] border-l border-border">Answer</div>
                  </div>
                  {/* rows */}
                  {[
                    { q: "What's the delivery time?",                a: '2–3 days',                           req: true  },
                    { q: "What's your exchange & refund policy?",   a: 'All orders final · no refunds',      req: true  },
                    { q: 'When is the camo tshirt restocking?',     a: 'Restocking next week',               req: false },
                  ].map((row, i, arr) => (
                    <div key={row.q} className={`grid grid-cols-[58%_42%] ${i < arr.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="px-[0.7rem] py-[0.45rem] flex items-center gap-[0.45rem] min-w-0">
                        <span className="text-[0.56rem] text-text-primary truncate leading-[1.3]">{row.q}</span>
                        {row.req && (
                          <span className="text-[0.4rem] uppercase tracking-[0.1em] border border-border rounded px-[4px] py-[1px] text-text-tertiary shrink-0">Required</span>
                        )}
                      </div>
                      <div className="px-[0.7rem] py-[0.45rem] text-[0.56rem] text-text-secondary border-l border-border truncate leading-[1.3]">{row.a}</div>
                    </div>
                  ))}
                  {/* add question row */}
                  <div className="border-t border-dashed border-border mx-[0.5rem] my-[0.45rem] rounded-[6px] py-[0.4rem] text-center text-[0.5rem] text-text-tertiary flex items-center justify-center gap-[4px]">
                    <svg className="w-[9px] h-[9px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    Add question
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* STEP 03 — Test */}
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-[26px] h-[26px] rounded-full bg-btn-bg text-btn-text flex items-center justify-center text-[0.56rem] font-medium tabular-nums">03</div>
                <div className="flex-1 h-[1px] bg-border" />
              </div>
              <h3 className="text-[0.92rem] font-medium text-text-primary mb-[0.4rem] tracking-[-0.01em]">Test it out.</h3>
              <p className="text-[0.76rem] text-text-secondary leading-[1.75] font-light max-w-[340px] mb-6">
                Chat with Luna yourself. Tune her replies until they sound exactly like your brand.
              </p>
              <div className="step-scene" onMouseMove={handleSceneMove} onMouseLeave={handleSceneLeave}>
                <div className="step-scene-glow" />
                <div className="scene-stage">
                {/* Chat window tilted */}
                <div className="scene-card" style={{ top: '8%', left: '10%', width: '80%', transform: 'perspective(1000px) rotateX(10deg) rotateY(-10deg) rotateZ(-3deg)' }}>
                  {/* header */}
                  <div className="flex items-center gap-[0.4rem] px-[0.65rem] py-[0.5rem] border-b border-border">
                    <div className="relative w-[20px] h-[20px] shrink-0">
                      <div className="absolute inset-[-1.5px] rounded-full" style={{ background: dk ? 'rgba(255,255,255,0.18)' : 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)' }} />
                      <div className="absolute inset-[1px] rounded-full bg-background" />
                      <div className="absolute inset-[2.5px] rounded-full flex items-center justify-center text-[0.35rem] font-bold text-white" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>ZN</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.58rem] font-semibold text-text-primary truncate">zaynab.nour</div>
                      <div className="text-[0.46rem] text-text-tertiary">Active now</div>
                    </div>
                    <div className="flex items-center gap-[3px] rounded-[10px] px-[5px] py-[2px] text-[0.45rem] font-medium bg-background3 border border-border text-text-secondary">
                      <span className="w-[4px] h-[4px] rounded-full bg-[#3dbb77] animate-pulse" />
                      Luna
                    </div>
                  </div>
                  {/* messages */}
                  <div className="p-[0.65rem] flex flex-col gap-[0.35rem]">
                    <div className="self-start max-w-[72%] bg-background3 text-text-primary px-[0.55rem] py-[0.35rem] rounded-[10px] rounded-bl-[3px] text-[0.55rem] leading-[1.45]">
                      Do you have the black tee in medium?
                    </div>
                    <div className="self-end max-w-[78%] text-white px-[0.55rem] py-[0.35rem] rounded-[10px] rounded-br-[3px] text-[0.55rem] leading-[1.45] shadow-sm" style={{ background: 'linear-gradient(135deg,#c13584,#e1306c 40%,#fd5949 75%,#ffcd67)' }}>
                      Yes — black tee, size M, in stock ✨ Want me to place the order?
                    </div>
                    <div className="self-start max-w-[60%] bg-background3 border border-border text-text-secondary px-[0.55rem] py-[0.3rem] rounded-[10px] rounded-bl-[3px] text-[0.52rem] leading-[1.4] flex items-center gap-[4px]">
                      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* STEP 04 — Go live */}
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-[26px] h-[26px] rounded-full bg-btn-bg text-btn-text flex items-center justify-center text-[0.56rem] font-medium tabular-nums">04</div>
                <div className="flex-1 h-[1px] bg-border" />
              </div>
              <h3 className="text-[0.92rem] font-medium text-text-primary mb-[0.4rem] tracking-[-0.01em]">Go live.</h3>
              <p className="text-[0.76rem] text-text-secondary leading-[1.75] font-light max-w-[340px] mb-6">
                Turn Luna on. Every DM — orders, returns, questions — handled automatically, 24/7.
              </p>
              <div className="step-scene" onMouseMove={handleSceneMove} onMouseLeave={handleSceneLeave}>
                <div className="step-scene-glow" />
                <div className="scene-stage">
                {/* Dashboard panel tilted */}
                <div className="scene-card" style={{ top: '10%', left: '6%', width: '88%', transform: 'perspective(1000px) rotateX(10deg) rotateY(-12deg) rotateZ(-2deg)' }}>
                  {/* header */}
                  <div className="flex items-center justify-between px-[0.75rem] py-[0.55rem] border-b border-border">
                    <div className="text-[0.56rem] font-medium text-text-primary">Luna · Inbox</div>
                    <div className="flex items-center gap-[5px] bg-background3 border border-border rounded-[10px] px-[7px] py-[2px]">
                      <span className="w-[5px] h-[5px] rounded-full bg-[#3dbb77] animate-pulse" />
                      <span className="text-[0.48rem] text-text-secondary uppercase tracking-[0.08em]">Live</span>
                    </div>
                  </div>
                  {/* rows */}
                  <div>
                    {[
                      { init: 'ZN', grad: 'linear-gradient(135deg,#667eea,#764ba2)', name: 'zaynab.nour',  preview: 'Placed order · M Black Tee',     time: 'now' },
                      { init: 'LM', grad: 'linear-gradient(135deg,#f093fb,#f5576c)', name: 'lina.maged',   preview: 'Asked about delivery to Cairo',  time: '2m' },
                      { init: 'SR', grad: 'linear-gradient(135deg,#4facfe,#00f2fe)', name: 'sara.rami',    preview: 'Refund processed · Order #2241', time: '5m' },
                    ].map((r) => (
                      <div key={r.name} className="flex items-center gap-[0.5rem] px-[0.75rem] py-[0.45rem] border-b border-border last:border-b-0">
                        <div className="w-[20px] h-[20px] rounded-full shrink-0 flex items-center justify-center text-[0.4rem] font-bold text-white" style={{ background: r.grad }}>{r.init}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.58rem] font-medium text-text-primary truncate leading-tight">{r.name}</div>
                          <div className="text-[0.48rem] text-text-tertiary truncate">{r.preview}</div>
                        </div>
                        <span className="text-[0.48rem] text-text-tertiary shrink-0">{r.time}</span>
                      </div>
                    ))}
                  </div>
                  {/* footer stat strip */}
                  <div className="grid grid-cols-3 border-t border-border">
                    {[
                      { val: '142',  label: 'Today' },
                      { val: '~0s',  label: 'Reply' },
                      { val: '24/7', label: 'Uptime' },
                    ].map((s, i) => (
                      <div key={s.label} className={`text-center py-[0.45rem] ${i < 2 ? 'border-r border-border' : ''}`}>
                        <div className="text-[0.68rem] font-light tracking-[-0.03em] text-text-primary leading-none">{s.val}</div>
                        <div className="text-[0.44rem] uppercase tracking-[0.1em] text-text-tertiary mt-[2px]">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="h-[1px] bg-border" />

        {/* Intelligence Section */}
        <div className="py-44 px-8 max-w-[960px] mx-auto">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">Luna — Intelligence Layer</div>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] max-w-[540px] mb-[0.9rem]">
                Conversations become data.
              </h2>
              <p className="text-[0.8rem] text-text-secondary leading-[1.8] max-w-[460px] font-light">
                Every message your customers send contains a signal. Luna extracts the patterns — surfacing what your brand needs to know to improve products, content, and decisions.
              </p>
            </div>
            <ul className="list-none border border-border rounded-[10px] overflow-hidden">
              {[
                'What are customers asking most?',
                'Where do they hesitate before buying?',
                'Which products generate the most inquiries?',
                'What complaints repeat?',
                'When does engagement peak?'
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-4 p-4 px-5 border-b border-border last:border-b-0 text-[0.75rem] text-text-secondary bg-background hover:bg-background3 hover:text-text-primary transition-all duration-150">
                  <span className="text-[0.62rem] text-text-tertiary w-4 text-right shrink-0">0{index + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-[1px] bg-border" />

        {/* Pricing teaser — links to /pricing for the full experience */}
        <div className="py-44 px-8 max-w-[960px] mx-auto" id="pricing">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">Pricing</div>
          <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] max-w-[540px] mb-[0.9rem]">
            Four tiers.<br />Every feature in each.
          </h2>
          <p className="text-[0.8rem] text-text-secondary leading-[1.8] max-w-[460px] font-light mb-10">
            Usage-based pricing. Only the quotas change as you scale — conversations,
            products synced, saved answers, active issues.
          </p>
          <div className="border border-border rounded-[10px] overflow-hidden flex flex-col gap-[1px] bg-border">
            {[
              { name: 'Bronze',   tag: 'Solo operators',   price: '$29',    period: '/ mo' },
              { name: 'Silver',   tag: 'Growing stores',   price: '$89',    period: '/ mo' },
              { name: 'Gold',     tag: 'Scale teams',      price: '$249',   period: '/ mo' },
              { name: 'Obsidian', tag: 'Enterprise',       price: 'Custom', period: '' },
            ].map((item) => (
              <div key={item.name} className="bg-background p-[1.1rem] px-6 flex items-center justify-between text-[0.75rem] text-text-primary hover:bg-background3 transition-colors duration-150">
                <div className="flex items-center gap-[0.7rem]">
                  <span>{item.name}</span>
                  <span className="text-[0.58rem] uppercase tracking-[0.06em] text-text-tertiary">{item.tag}</span>
                </div>
                <span className="text-[0.75rem] text-text-primary tabular-nums">
                  {item.price}
                  {item.period && <span className="text-[0.62rem] text-text-tertiary ml-[3px]">{item.period}</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button href="/pricing" variant="secondary">
              See full pricing
              <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Button>
          </div>
        </div>

        {/* FAQ teaser — links to /faq */}
        <div className="py-40 px-8 max-w-[960px] mx-auto text-center" id="faq">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">FAQ</div>
          <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] mb-4">
            Have questions?
          </h2>
          <p className="text-[0.8rem] text-text-secondary font-light mb-8 max-w-[400px] mx-auto leading-[1.8]">
            We've answered the most common ones about Luna, pricing, and integrations.
          </p>
          <Button href="/faq" variant="secondary">
            Browse FAQ
            <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Button>
        </div>

        <div className="h-[1px] bg-border" />

        {/* CTA Section */}
        <div className="text-center border-b border-border py-40 px-8">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">Early Access</div>
          <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] mx-auto mb-[0.9rem]">
            Start with Luna.<br />Scale with Krew.
          </h2>
          <p className="text-[0.8rem] text-text-secondary leading-[1.8] max-w-[460px] font-light mx-auto mb-8">
            We're onboarding select brands into Luna now. Be among the first to turn your inbox into an operation.
          </p>
          <div className="flex justify-center" style={{ gap: 'var(--btn-gap)' }}>
            <Button href="/early-access" variant="primary">
              Request access
            </Button>
            <Button variant="secondary">
              Talk to the team
            </Button>
          </div>
        </div>

        <Footer />
      </div>

      <style jsx>{`
        /* ── HOW IT WORKS — floating tilted UI mockups (no frame) ── */
        .step-scene {
          position: relative;
          height: 320px;
          perspective: 1400px;
          transform-style: preserve-3d;
          --tilt-rx: 0deg;
          --tilt-ry: 0deg;
          --tilt-lift: 0;
        }
        .step-scene-glow { display: none; }
        .scene-stage {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          transform:
            rotateX(var(--tilt-rx))
            rotateY(var(--tilt-ry))
            translateZ(calc(var(--tilt-lift) * 20px))
            scale(calc(1 + var(--tilt-lift) * 0.02));
          transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .step-scene:hover .scene-stage {
          transition: transform 0.12s ease-out;
        }
        .scene-card {
          position: absolute;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          box-shadow:
            0 18px 36px rgba(0,0,0,0.10),
            0 4px 10px rgba(0,0,0,0.06),
            inset 0 1px 0 rgba(255,255,255,0.04);
          transform-origin: center center;
          transform-style: preserve-3d;
          overflow: hidden;
          transition: box-shadow 0.4s ease;
        }
        .step-scene:hover .scene-card {
          box-shadow:
            0 28px 52px rgba(0,0,0,0.16),
            0 8px 16px rgba(0,0,0,0.10),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }
        @media (max-width: 820px) {
          .step-scene { height: 280px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .scene-stage { transition: none; transform: none; }
        }

        /* ── WHY LUNA — pinned scroll, site-native minimal styling ── */
        .why-outer {
          position: relative;
          height: 260vh;
        }
        .why-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
        }

        /* Minimal centered column — eyebrow / folder / heading / blurb */
        .why-center {
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 3;
          pointer-events: none;
          max-width: 460px;
          padding: 0 1rem;
        }

        /* Cards — bigger, same minimal style */
        .why-card-v2 {
          position: absolute;
          width: min(380px, 44vw);
          padding: 1.4rem 1.5rem 1.45rem;
          border-radius: 14px;
          transform-origin: center center;
          will-change: transform, opacity;
          box-shadow:
            0 22px 48px rgba(0,0,0,0.18),
            0 4px 10px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.04);
          perspective: 1400px;
          --tilt-rx: 0deg;
          --tilt-ry: 0deg;
          --tilt-lift: 0;
          transition: box-shadow 0.4s ease;
        }
        .why-card-v2:hover {
          box-shadow:
            0 30px 60px rgba(0,0,0,0.22),
            0 8px 18px rgba(0,0,0,0.12),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .why-card-inner {
          transform-style: preserve-3d;
          transform:
            rotateX(var(--tilt-rx))
            rotateY(var(--tilt-ry))
            translateZ(calc(var(--tilt-lift) * 14px));
          transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .why-card-v2:hover .why-card-inner {
          transition: transform 0.12s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .why-card-inner { transition: none; transform: none; }
        }

        /* Mobile: skip the pinned scatter — stack cards in a normal flow */
        @media (max-width: 820px) {
          .why-outer { height: auto; }
          .why-sticky {
            position: static;
            height: auto;
            padding: 4rem 1.2rem;
          }
          .why-center {
            position: relative;
            left: auto !important; top: auto !important;
            transform: none;
            margin: 0 auto 2.5rem;
          }
          .why-card-v2 {
            position: relative !important;
            inset: auto !important;
            width: 100%;
            max-width: 440px;
            margin: 0 auto 0.8rem;
            transform: none !important;
            opacity: 1 !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .why-card-v2 {
            transform: none !important;
            opacity: 1 !important;
          }
        }

        /* Integration logos */
        .integ-logo-item {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 5px 12px; border: 1px solid var(--border);
          border-radius: 8px; background: var(--bg2);
          font-size: 0.67rem; font-weight: 500; color: var(--text-secondary);
          white-space: nowrap; transition: border-color 0.2s, color 0.2s;
        }
        .integ-logo-item:hover { border-color: var(--border-md); color: var(--text-primary); }

        /* Typing indicator dots */
        :global(.typing-dot) {
          display: inline-block;
          width: 3px; height: 3px; border-radius: 50%;
          background: rgba(255,255,255,0.45);
          animation: typingBounce 1.2s infinite ease-in-out;
        }
        :global(.typing-dot:nth-child(2)) { animation-delay: 0.18s; }
        :global(.typing-dot:nth-child(3)) { animation-delay: 0.36s; }
        @keyframes typingBounce {
          0%,60%,100% { transform: translateY(0); opacity: 0.45; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

      `}</style>
    </>
  );
}
