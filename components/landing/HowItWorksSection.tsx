'use client';

import { useTheme } from '@/components/ThemeProvider';

// =============================================================================
// HOW IT WORKS — four-step, cursor-tilted UI mockups. PARKED (Phase 2.4): this
// is the beta agent's own-page content, lifted out of the homepage intact so
// Phase 3 (/agents/luna) can mount it without a rewrite. Not rendered on the
// homepage. Copy here still names the beta agent; that becomes legitimate once
// it lives on that agent's page.
// =============================================================================

export default function HowItWorksSection() {
  const { theme } = useTheme();
  const dk = theme === 'dark';

  // cursor-driven 3D tilt for each scene
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
      `}</style>
    </>
  );
}
