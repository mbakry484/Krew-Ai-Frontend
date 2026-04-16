'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, ReactNode, ComponentType } from 'react';

// ─── Scroll-reveal ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.transition = `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref}>{children}</div>;
}

// ─── Feature graphics ──────────────────────────────────────────────────────────

function OrderCreationGraphic() {
  return (
    <div className="flex items-center justify-center gap-3 w-full max-w-[480px]">
      <div className="flex-1 border border-[var(--border)] rounded-[12px] p-4 bg-[var(--bg3)]">
        <div className="text-[0.58rem] text-[var(--text-tertiary)] uppercase tracking-[0.08em] mb-3">Instagram DM</div>
        <div className="bg-[var(--bg4)] border border-[var(--border)] rounded-[12px] px-3 py-2 inline-block">
          <p className="text-[0.72rem] text-[var(--text-secondary)] leading-[1.5]">I want the black hoodie, size M 🙏</p>
        </div>
      </div>
      <div className="flex items-center shrink-0 px-1">
        <svg width="44" height="16" viewBox="0 0 44 16" fill="none">
          <line x1="0" y1="8" x2="36" y2="8" stroke="var(--border-md)" strokeWidth="1" strokeDasharray="4 3"/>
          <path d="M36 4L42 8L36 12" stroke="var(--border-md)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="flex-1 border border-[var(--border)] rounded-[12px] p-4 bg-[var(--bg3)]">
        <div className="text-[0.58rem] text-[var(--text-tertiary)] uppercase tracking-[0.08em] mb-3">Shopify Order</div>
        <div className="space-y-[5px]">
          <div className="text-[0.75rem] text-[var(--text-primary)] font-medium">Order #1042</div>
          <div className="text-[0.68rem] text-[var(--text-secondary)]">Black Hoodie — Size M</div>
          <div className="flex items-center gap-[5px] pt-[2px]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#3dbb77]" />
            <span className="text-[0.62rem] text-[#3dbb77]">Created</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExchangesGraphic() {
  return (
    <div className="w-full max-w-[380px] border border-[var(--border)] rounded-[14px] overflow-hidden bg-[var(--bg3)]">
      <div className="divide-y divide-[var(--border)]">
        {[
          { name: 'Sara M.', item: 'White Linen Dress', status: 'Pending' },
          { name: 'Karim T.', item: 'Classic Jacket — L', status: 'Pending' },
          { name: 'Nour A.', item: 'Cargo Trousers — M', status: 'Pending' },
        ].map((r) => (
          <div key={r.name} className="flex items-center justify-between px-4 py-[0.75rem]">
            <div>
              <div className="text-[0.73rem] text-[var(--text-primary)]">{r.name}</div>
              <div className="text-[0.62rem] text-[var(--text-tertiary)] mt-[1px]">{r.item}</div>
            </div>
            <span className="text-[0.6rem] px-[8px] py-[3px] rounded-full border border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.07)] text-[#c9a227]">{r.status}</span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-[var(--border)]">
        <div className="w-full bg-[var(--btn-bg)] text-[var(--btn-text)] rounded-[8px] py-2 text-[0.72rem] font-medium text-center">Approve All</div>
      </div>
    </div>
  );
}

function KnowledgeBaseGraphic() {
  return (
    <div className="w-full max-w-[400px] border border-[var(--border)] rounded-[14px] p-6 bg-[var(--bg3)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-[8px] h-[8px] rounded-full bg-[var(--border-md)]" />
        <div className="w-[8px] h-[8px] rounded-full bg-[var(--border-md)]" />
        <div className="w-[8px] h-[8px] rounded-full bg-[var(--border-md)]" />
      </div>
      <div className="font-mono text-[0.72rem] text-[var(--text-secondary)] space-y-[0.9rem] leading-[1.6]">
        {['Classic Jacket — restocking next week', 'Free shipping on orders above 500 EGP'].map((t) => (
          <div key={t} className="flex gap-3"><span className="text-[var(--text-tertiary)] select-none">·</span><span>{t}</span></div>
        ))}
        <div className="flex gap-3">
          <span className="text-[var(--text-tertiary)] select-none">·</span>
          <span>Size guide updated for winter collection<span className="luna-cursor ml-[1px] text-[var(--text-tertiary)]">|</span></span>
        </div>
      </div>
    </div>
  );
}

function InsightsGraphic() {
  return (
    <div className="flex items-start gap-10 w-full max-w-[440px]">
      <div className="flex flex-col items-center shrink-0">
        <div className="text-[3.2rem] font-light tracking-[-0.05em] text-[var(--text-primary)] leading-none">
          87<sup className="text-[1.4rem] text-[var(--text-tertiary)] font-light">%</sup>
        </div>
        <svg width="96" height="52" viewBox="0 0 96 52" fill="none" className="mt-2">
          <path d="M4 48 A44 44 0 0 1 92 48" stroke="var(--border-md)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M4 48 A44 44 0 0 1 76 15" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <div className="text-[0.6rem] text-[var(--text-tertiary)] text-center mt-1 leading-[1.4]">Customer<br/>satisfaction</div>
      </div>
      <div className="flex-1 space-y-[0.7rem] pt-2">
        {['Order status enquiries','Sizing questions','Return & exchange policy','Restock availability'].map((item, i) => (
          <div key={item} className="flex items-center gap-3">
            <span className="text-[0.58rem] text-[var(--text-tertiary)] font-mono min-w-[18px]">#{i + 1}</span>
            <span className="text-[0.72rem] text-[var(--text-secondary)]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MultilingualGraphic() {
  return (
    <div className="border border-[var(--border)] rounded-[28px] w-[210px] bg-[var(--bg3)] overflow-hidden">
      <div className="flex justify-center pt-4 pb-3 border-b border-[var(--border)]">
        <div className="w-[44px] h-[5px] rounded-full bg-[var(--border-md)]" />
      </div>
      <div className="px-4 py-5 flex flex-col gap-3">
        {[{text:'Where is my order?',rtl:false},{text:'فين طلبي؟',rtl:true},{text:'Feen 6alabi?',rtl:false}].map((b,i) => (
          <div key={i} className="flex justify-end">
            <div className="bg-[var(--bg4)] border border-[var(--border)] rounded-[14px] rounded-br-[4px] px-3 py-[6px] max-w-[90%]" dir={b.rtl?'rtl':'ltr'}>
              <span className="text-[0.7rem] text-[var(--text-secondary)]">{b.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQGraphic() {
  return (
    <div className="w-full max-w-[380px] space-y-3">
      <div className="flex justify-start">
        <div className="bg-[var(--bg4)] border border-[var(--border)] rounded-[16px] rounded-tl-[4px] px-4 py-3 max-w-[80%]">
          <p className="text-[0.72rem] text-[var(--text-secondary)] leading-[1.5]">When does the Classic Jacket restock?</p>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-[var(--bg3)] border border-[var(--border-md)] rounded-[16px] rounded-tr-[4px] px-4 py-3 max-w-[80%]">
          <p className="text-[0.72rem] text-[var(--text-primary)] leading-[1.5]">The Classic Jacket is back next week! I&apos;ll save your size if you&apos;d like 🙌</p>
        </div>
      </div>
    </div>
  );
}

function EscalationGraphic() {
  return (
    <div className="flex flex-col items-end gap-0 w-full max-w-[320px] pr-4">
      <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-[14px] rounded-br-[4px] px-4 py-3 self-end max-w-[85%]">
        <p className="text-[0.72rem] text-[var(--text-secondary)] leading-[1.5]">Let me pass you to the team, they&apos;ll help right away.</p>
      </div>
      <div className="flex flex-col items-center self-center mt-1">
        <div className="w-[1px] h-[44px] border-l border-dashed border-[var(--border-md)]" />
        <div className="w-9 h-9 rounded-full border border-[var(--border-md)] bg-[var(--bg4)] flex items-center justify-center mt-[-1px]">
          <svg className="w-[15px] h-[15px] text-[var(--text-tertiary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div className="text-[0.58rem] text-[var(--text-tertiary)] mt-[6px]">Human agent</div>
      </div>
    </div>
  );
}

// ─── Feature data ──────────────────────────────────────────────────────────────
interface Feature { id: string; name: string; description: string; cta: string; Graphic: ComponentType; }

const FEATURES: Feature[] = [
  { id: 'orders',      name: 'Order Creation.',      description: 'Takes orders straight from DMs and creates them in Shopify automatically — no manual entry, zero missed sales.',                      cta: 'How it works', Graphic: OrderCreationGraphic },
  { id: 'exchanges',   name: 'Exchanges & Refunds.',  description: 'Luna collects every request and holds them in one place — you approve with one click.',                                               cta: 'See the flow',  Graphic: ExchangesGraphic    },
  { id: 'kb',          name: 'Knowledge Base.',       description: "Tell Luna what to know. She'll use it in every conversation, automatically.",                                                         cta: 'Learn more',    Graphic: KnowledgeBaseGraphic},
  { id: 'insights',    name: 'Insights.',             description: 'Luna tracks every conversation and tells you exactly how your store is performing.',                                                  cta: 'View demo',     Graphic: InsightsGraphic     },
  { id: 'multilingual',name: 'Multilingual.',         description: "Luna replies in the customer's language — English, Arabic, or Franco Arabic — automatically.",                                       cta: 'Learn more',    Graphic: MultilingualGraphic },
  { id: 'faqs',        name: 'Policy FAQs.',          description: 'Restocks, sizing, shipping — Luna answers instantly, every time.',                                                                   cta: 'Learn more',    Graphic: FAQGraphic          },
  { id: 'escalation',  name: 'Human Escalation.',     description: 'Luna knows when to step back. Your team picks up exactly where she left off.',                                                       cta: 'Learn more',    Graphic: EscalationGraphic   },
];

function FeatureBlock({ name, description, cta, Graphic }: Feature) {
  return (
    <div className="px-10 py-14 border-b border-[var(--border)] max-md:px-6 max-md:py-10">
      <div className="flex items-start justify-between gap-4 mb-10">
        <p className="text-[0.9rem] leading-[1.7] max-w-[440px]">
          <span className="font-semibold text-[var(--text-primary)]">{name}</span>{' '}
          <span className="text-[var(--text-secondary)]">{description}</span>
        </p>
        <button className="shrink-0 rounded-full border border-[var(--border-md)] px-[14px] py-[5px] text-[0.65rem] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] transition-all duration-150 whitespace-nowrap">
          {cta}
        </button>
      </div>
      <div className="flex justify-center"><Graphic /></div>
    </div>
  );
}

// ─── iMessage-style bubble primitives ─────────────────────────────────────────
function usePopIn() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  return {
    opacity: shown ? 1 : 0,
    transform: shown ? 'scale(1) translateY(0)' : 'scale(0.86) translateY(14px)',
    transformOrigin: 'bottom right' as const,
    transition: 'opacity 0.32s ease-out, transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };
}

function TypingBubble({ compact = false }: { compact?: boolean }) {
  const pop = usePopIn();
  const dotSize = compact ? 9 : 9;
  const dot = (delay: string) => ({
    width: dotSize,
    height: dotSize,
    borderRadius: '50%',
    background: '#9ca3af',
    display: 'inline-block',
    animation: 'typingBounce 1.2s ease-in-out infinite',
    animationDelay: delay,
  });
  return (
    <div
      className="bg-white"
      style={{
        borderRadius: compact ? 22 : 22,
        padding: compact ? '1rem 1.35rem' : '1.15rem 1.45rem',
        boxShadow: compact ? '0 10px 28px rgba(0,0,0,0.22)' : '0 16px 50px rgba(0,0,0,0.32)',
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 7 : 7,
        ...pop,
      }}
    >
      <span style={dot('0s')} />
      <span style={dot('0.15s')} />
      <span style={dot('0.30s')} />
    </div>
  );
}

function MessageBubble({
  children,
  withTail = false,
  compact = false,
}: {
  children: ReactNode;
  withTail?: boolean;
  compact?: boolean;
}) {
  const pop = usePopIn();
  return (
    <div
      className="relative bg-white"
      style={{
        borderRadius: compact ? 24 : 26,
        padding: compact ? '1.15rem 1.45rem' : '2.4rem 3rem',
        boxShadow: compact ? '0 14px 36px rgba(0,0,0,0.26)' : '0 20px 70px rgba(0,0,0,0.4)',
        maxWidth: compact ? '92%' : undefined,
        ...pop,
      }}
    >
      <p style={{
        fontSize: compact ? '1.4rem' : '2.6rem',
        fontWeight: compact ? 500 : 300,
        color: '#111827',
        letterSpacing: compact ? '-0.02em' : '-0.03em',
        lineHeight: compact ? 1.3 : 1.25,
        whiteSpace: compact ? 'normal' : 'nowrap',
        margin: 0,
      }}>
        {children}
      </p>
      {withTail && (
        <div style={{
          position: 'absolute',
          bottom: compact ? -10 : -12,
          right:  compact ? 20  : 28,
          width: 0, height: 0,
          borderLeft: compact ? '10px solid transparent' : '12px solid transparent',
          borderTop:  compact ? '10px solid #ffffff'    : '12px solid #ffffff',
        }} />
      )}
    </div>
  );
}

function CtaBubble({ compact = false, withTail = false }: { compact?: boolean; withTail?: boolean }) {
  const pop = usePopIn();
  return (
    <Link
      href="/auth/signup"
      className="relative group"
      style={{
        background: '#000000',
        color: '#ffffff',
        borderRadius: compact ? 22 : 26,
        padding: compact ? '1.05rem 1.4rem' : '1.6rem 2.1rem',
        boxShadow: compact ? '0 12px 32px rgba(0,0,0,0.32)' : '0 20px 60px rgba(0,0,0,0.5)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 12 : 14,
        textDecoration: 'none',
        ...pop,
      }}
    >
      <span style={{
        fontSize: compact ? '1.4rem' : '1.7rem',
        fontWeight: compact ? 500 : 400,
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
      }}>
        Try Luna now
      </span>
      <svg
        width={compact ? 18 : 20}
        height={compact ? 18 : 20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        className="group-hover:translate-x-[3px]"
      >
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
      </svg>
      {withTail && (
        <div style={{
          position: 'absolute',
          bottom: compact ? -10 : -12,
          right:  compact ? 20  : 28,
          width: 0, height: 0,
          borderLeft: compact ? '10px solid transparent' : '12px solid transparent',
          borderTop:  compact ? '10px solid #000000'    : '12px solid #000000',
        }} />
      )}
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function LunaAgentPage() {
  // ── Hero blur-in (matches landing page pattern) ──
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setHeroReady(true)));
  }, []);

  // ── iMessage-style sequence for the right-side bubbles ──
  // Stages: idle → topTyping → topMsg → botTyping → botMsg → ctaTyping → ctaMsg
  type Stage = 'idle' | 'topTyping' | 'topMsg' | 'botTyping' | 'botMsg' | 'ctaTyping' | 'ctaMsg';
  const [stage, setStage] = useState<Stage>('idle');

  useEffect(() => {
    if (!heroReady) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage('topTyping'), 600));
    timers.push(setTimeout(() => setStage('topMsg'),    2100));
    timers.push(setTimeout(() => setStage('botTyping'), 2900));
    timers.push(setTimeout(() => setStage('botMsg'),    4700));
    timers.push(setTimeout(() => setStage('ctaTyping'), 5600));
    timers.push(setTimeout(() => setStage('ctaMsg'),    6900));
    return () => timers.forEach(clearTimeout);
  }, [heroReady]);

  const showTopTyping = stage === 'topTyping';
  const showTopMsg    = stage === 'topMsg' || stage === 'botTyping' || stage === 'botMsg' || stage === 'ctaTyping' || stage === 'ctaMsg';
  const showBotTyping = stage === 'botTyping';
  const showBotMsg    = stage === 'botMsg' || stage === 'ctaTyping' || stage === 'ctaMsg';
  const showCtaTyping = stage === 'ctaTyping';
  const showCtaMsg    = stage === 'ctaMsg';

  return (
    <>
      {/* ── HERO ── */}
      <section className="luna-grid-bg bg-background overflow-hidden">

        {/* ── DESKTOP hero — hidden on mobile ── */}
        <div className="max-md:hidden relative" style={{ minHeight: '100svh' }}>
          <div className="luna-crosshair" style={{ top: -8, left: -8 }} />
          <div className="luna-crosshair" style={{ top: -8, right: -8 }} />
          <div className="luna-crosshair" style={{ bottom: -8, left: -8 }} />
          <div className="luna-crosshair" style={{ bottom: -8, right: -8 }} />

          {/* Bubbles column — iMessage-style sequence, bottom-anchored so new bubbles push older ones up */}
          <div style={{ position: 'absolute', bottom: '8%', right: '5%', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>

            {/* Slot 1 — typing dots, then "Zero missed messages." */}
            {showTopTyping && <TypingBubble key="t-top" />}
            {showTopMsg    && <MessageBubble key="m-top">Zero missed messages.</MessageBubble>}

            {/* Slot 2 — typing dots, then the main message */}
            {showBotTyping && <TypingBubble key="t-bot" />}
            {showBotMsg    && (
              <MessageBubble key="m-bot">
                Orders. Exchanges &amp; Refunds.<br />
                Replies. All handled.
              </MessageBubble>
            )}

            {/* Slot 3 — typing dots, then the "Try Luna now" CTA bubble (with tail) */}
            {showCtaTyping && <TypingBubble key="t-cta" />}
            {showCtaMsg    && <CtaBubble key="m-cta" withTail />}

          </div>

          {/* CTA card — bottom left, same level as bubble */}
          <div
            className={`bg-background3 border border-border ${heroReady ? 'hero-blur-in' : ''}`}
            style={{ position: 'absolute', bottom: '8%', left: '5%', width: 460, zIndex: 10, borderRadius: 20, padding: '1.8rem 2rem', opacity: heroReady ? undefined : 0, animationDelay: '0ms' }}
          >
            <h1 style={{ fontSize: 'clamp(1.7rem,2.8vw,2.6rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1rem' }}
              className="text-text-primary">
              Less inbox.<br />More business.
            </h1>

            {/* Video placeholder */}
            <div
              className="border border-border bg-background2 flex flex-col items-center justify-center gap-2 mb-4"
              style={{ borderRadius: 10, aspectRatio: '16/9', width: '100%' }}
            >
              <div className="w-9 h-9 rounded-full border border-border-md flex items-center justify-center text-text-tertiary hover:border-border-hover hover:text-text-secondary transition-all duration-200 cursor-pointer">
                <svg className="w-4 h-4 ml-[2px]" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <span className="text-[0.6rem] text-text-tertiary uppercase tracking-[0.1em]">Demo coming soon</span>
            </div>

            <p className="text-text-secondary mb-5 leading-[1.6]" style={{ fontSize: '0.82rem' }}>
              Luna handles your Instagram DMs — replies, orders, exchanges, and refunds — so you can focus on building.
            </p>

            <div className="flex items-center gap-2">
              <button className="bg-btn-bg text-btn-text rounded-[8px] font-medium hover:opacity-85 transition-opacity duration-200" style={{ padding: '9px 18px', fontSize: '0.78rem' }}>
                Join Waitlist
              </button>
              <button className="border border-border-md text-text-secondary rounded-[8px] hover:border-border-hover hover:text-text-primary transition-all duration-200" style={{ padding: '9px 18px', fontSize: '0.78rem' }}>
                Try Live Demo
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE hero — hidden on desktop ── */}
        <div className="hidden max-md:flex flex-col px-4 pt-16 pb-8 relative">
          <div className="luna-crosshair" style={{ top: -8, left: -8 }} />
          <div className="luna-crosshair" style={{ top: -8, right: -8 }} />

          {/* iMessage-style bubble stack — bottom-anchored within a sized container so new bubbles push older ones up */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            gap: 12,
            minHeight: 320,
          }}>
            {showTopTyping && <TypingBubble key="t-top-m" compact />}
            {showTopMsg    && <MessageBubble key="m-top-m" compact>Zero missed messages.</MessageBubble>}
            {showBotTyping && <TypingBubble key="t-bot-m" compact />}
            {showBotMsg    && (
              <MessageBubble key="m-bot-m" compact>
                Orders. Exchanges &amp; Refunds.<br />
                Replies. All handled.
              </MessageBubble>
            )}
            {showCtaTyping && <TypingBubble key="t-cta-m" compact />}
            {showCtaMsg    && <CtaBubble key="m-cta-m" compact withTail />}
          </div>
        </div>

      </section>

      {/* ── FEATURES ── */}
      <section className="relative bg-background border-t border-border">
        <div className="flex items-start" style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div className="w-[36%] shrink-0 sticky top-0 h-screen flex flex-col justify-center pl-10 pr-12 max-md:hidden border-r border-[var(--border)]">
            <div className="text-[0.85rem] text-text-tertiary mb-4 tracking-[0.02em]">✦ &nbsp;Luna</div>
            <h2 className="text-[2rem] font-bold tracking-[-0.04em] text-text-primary leading-[1.15]">
              Everything your store needs, handled.
            </h2>
          </div>
          <div className="flex-1 min-w-0">
            <div className="hidden max-md:block px-6 py-10 border-b border-[var(--border)]">
              <div className="text-[0.82rem] text-text-tertiary mb-3">✦ &nbsp;Luna</div>
              <h2 className="text-[1.9rem] font-bold tracking-[-0.04em] text-text-primary leading-[1.15]">
                Everything your store needs, handled.
              </h2>
            </div>
            {FEATURES.map((f, i) => (
              <Reveal key={f.id} delay={i * 40}><FeatureBlock {...f} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="luna-grid-bg relative bg-background border-t border-border py-40 text-center px-8 overflow-hidden">
        <div className="luna-crosshair" style={{ top: -8, left: -8 }} />
        <div className="luna-crosshair" style={{ top: -8, right: -8 }} />
        <div className="luna-crosshair" style={{ bottom: -8, left: -8 }} />
        <div className="luna-crosshair" style={{ bottom: -8, right: -8 }} />
        <Reveal>
          <h2 className="text-[clamp(2rem,5vw,3.8rem)] font-bold tracking-[-0.04em] text-text-primary mb-4 leading-[1.1]">
            Ready to stop<br />answering DMs?
          </h2>
          <p className="text-[0.85rem] text-text-secondary mb-8 max-w-[380px] mx-auto leading-[1.65]">
            Join the waitlist and be the first to go live with Luna.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button className="bg-btn-bg text-btn-text px-6 py-3 rounded-[10px] text-[0.8rem] font-medium hover:opacity-85 transition-opacity duration-200">
              Join Waitlist
            </button>
            <button className="border border-border-md text-text-secondary px-6 py-3 rounded-[10px] text-[0.8rem] hover:border-border-hover hover:text-text-primary transition-all duration-200">
              Try Live Demo
            </button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
