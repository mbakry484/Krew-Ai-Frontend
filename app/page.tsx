'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// This is a static landing page — no API calls required.
// The demo chat animation is purely client-side/cosmetic.
// =============================================================================

export default function LandingPage() {
  const chatRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const dk = theme === 'dark';

  // Hero animation: keep elements at opacity:0 until after first paint,
  // then apply the animation class. Double RAF guarantees the browser has
  // committed the opacity:0 state before the animation starts — no flash.
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setHeroReady(true)));
  }, []);
  // phone palette — switches with theme
  const ph = {
    bg:          dk ? '#0a0a0a'                       : '#ffffff',
    border:      dk ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(0,0,0,0.10)',
    topbar:      dk ? '#0a0a0a'                       : '#f8f7f5',
    topBorder:   dk ? 'rgba(255,255,255,0.10)'        : 'rgba(0,0,0,0.08)',
    name:        dk ? '#ffffff'                       : '#1a1a1a',
    sub:         dk ? 'rgba(255,255,255,0.4)'         : 'rgba(0,0,0,0.4)',
    lunaChip:    dk ? { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)' }
                    : { bg: 'rgba(0,0,0,0.06)',       border: 'rgba(0,0,0,0.12)',       color: 'rgba(0,0,0,0.65)'       },
    inputBorder: dk ? 'rgba(255,255,255,0.18)'        : 'rgba(0,0,0,0.14)',
    placeholder: dk ? 'rgba(255,255,255,0.28)'        : 'rgba(0,0,0,0.3)',
    icon:        dk ? 'rgba(255,255,255,0.45)'        : 'rgba(0,0,0,0.35)',
    backArrow:   dk ? 'rgba(255,255,255,0.8)'         : 'rgba(0,0,0,0.7)',
  };

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Animated Instagram DM demo script
  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;

    const script = [
      { delay: 400,  type: 'time',    text: 'Today 2:14 PM' },
      { delay: 700,  type: 'in',      text: 'Hi! Do you have the linen coord set in beige? What sizes?' },
      { delay: 1500, type: 'typing',  duration: 1600 },
      { delay: 3100, type: 'out',     text: 'Hey! Yes, the linen coord set is in beige. Sizes XS–XL all in stock. Want to order?' },
      { delay: 4600, type: 'in',      text: 'Yes! How long does delivery take to Cairo?' },
      { delay: 5300, type: 'typing',  duration: 1400 },
      { delay: 6700, type: 'out',     text: 'Orders to Cairo arrive in 2–4 business days via Bosta 📦 Want me to help place the order?' },
      { delay: 7900, type: 'in',      text: 'What if I want to return it?' },
      { delay: 8600, type: 'typing',  duration: 1300 },
      { delay: 9900, type: 'out',     text: 'Free exchanges within 7 days of delivery ✨ Unworn with tags. Easy process!' },
    ];

    const loopDelay = 12500;
    let typingEl: HTMLElement | null = null;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const el = chat; // narrowed non-null reference

    function addMsg(type: string, text?: string) {
      if (typingEl) { typingEl.remove(); typingEl = null; }

      if (type === 'typing') {
        const row = document.createElement('div');
        row.className = 'demo-dm-row in';
        row.innerHTML = '<div class="demo-dm-avatar">ZN</div><div class="demo-dm-typing"><span></span><span></span><span></span></div>';
        el.appendChild(row);
        typingEl = row;
        el.scrollTop = el.scrollHeight;
        return;
      }

      if (type === 'time') {
        const ts = document.createElement('div');
        ts.className = 'demo-dm-ts';
        ts.textContent = text || '';
        el.appendChild(ts);
        el.scrollTop = el.scrollHeight;
        return;
      }

      const row = document.createElement('div');
      if (type === 'in') {
        row.className = 'demo-dm-row in';
        row.innerHTML = `<div class="demo-dm-avatar">ZN</div><div class="demo-dm-bubble in">${text}</div>`;
      } else {
        row.className = 'demo-dm-row out';
        row.innerHTML = `<div class="demo-luna-lbl">Luna</div><div class="demo-dm-bubble out">${text}</div>`;
      }
      el.appendChild(row);
      el.scrollTop = el.scrollHeight;
    }

    function runScript() {
      el.innerHTML = '';
      typingEl = null;
      script.forEach((s) => {
        const t = setTimeout(() => addMsg(s.type, s.text), s.delay);
        timers.push(t);
      });
      const loop = setTimeout(runScript, loopDelay);
      timers.push(loop);
    }

    runScript();
    return () => { timers.forEach(clearTimeout); };
  }, []);

  return (
    <>
      <div id="landing" className="min-h-screen pt-12">

        {/* ── HERO – SPLIT LAYOUT ── */}
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 grid hero-grid max-w-[1320px] mx-auto w-full px-12 gap-8 items-center min-h-[calc(100vh-48px-64px)]">

            {/* LEFT */}
            <div className="hero-left flex flex-col gap-[1.2rem] py-20 pr-8">

              <h1
                className={`${heroReady ? 'hero-blur-in' : ''} text-[clamp(2.3rem,3.6vw,3.5rem)] tracking-[-0.04em] leading-[1.08] text-text-primary`}
                style={{ opacity: heroReady ? undefined : 0, animationDelay: '0ms' }}
              >
                <span className="font-bold">Luna.</span>
                <span className="font-light"> Your brand&apos;s<br />customer service,<br />automated.</span>
              </h1>

              <p
                className={`${heroReady ? 'hero-blur-in' : ''} text-[0.88rem] text-text-secondary max-w-[480px] leading-[1.78] font-light`}
                style={{ opacity: heroReady ? undefined : 0, animationDelay: '120ms' }}
              >
                Luna handles every customer DM — orders, returns, questions — automatically.
              </p>

              <div
                className={`${heroReady ? 'hero-blur-in' : ''} flex gap-[0.9rem] mt-[0.2rem] flex-wrap items-center`}
                style={{ opacity: heroReady ? undefined : 0, animationDelay: '220ms' }}
              >
                <Link href="/auth/signup" className="bg-btn-bg text-btn-text border-none rounded-[8px] px-5 py-[9px] text-[0.8rem] font-medium hover:opacity-85 transition-opacity duration-200">
                  Start with Luna
                </Link>
                <Link href="/agents/luna" className="text-text-secondary text-[0.8rem] font-light hover:text-text-primary transition-colors duration-200">
                  Explore Luna →
                </Link>
              </div>
            </div>

            {/* RIGHT – layered demo */}
            <div
              className={`hero-right ${heroReady ? 'hero-blur-in-slow' : ''} flex items-center justify-start py-6 pl-4 overflow-visible`}
              style={{ opacity: heroReady ? undefined : 0, animationDelay: '100ms' }}
            >
              <div className="demo-wrap relative w-full" style={{ height: '540px' }}>

                {/* IG gradient glow */}
                <div className="demo-glow absolute inset-[-40px] rounded-full pointer-events-none z-0" style={{
                  background: 'radial-gradient(ellipse at 55% 45%, rgba(193,53,132,0.1) 0%, rgba(253,100,5,0.07) 35%, transparent 65%)'
                }} />

                {/* BACK: desktop dashboard */}
                <div className="demo-desktop-card absolute top-0 left-0 right-0 bg-background2 border border-border-md rounded-[16px] overflow-hidden z-[1]" style={{ height: '470px' }}>
                  {/* mac bar */}
                  <div className="bg-background3 border-b border-border px-[0.9rem] py-[0.65rem] flex items-center gap-2">
                    <div className="flex gap-[5px] mr-[0.6rem]">
                      <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                      <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                      <span className="w-2 h-2 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="flex-1 text-center text-[0.62rem] text-text-tertiary mr-6">Luna — Conversations</span>
                  </div>
                  {/* body */}
                  <div className="flex" style={{ height: 'calc(470px - 36px)' }}>
                    {/* tiny sidebar */}
                    <div className="w-[52px] border-r border-border bg-background flex flex-col items-center py-[1rem] gap-[0.85rem] shrink-0">
                      {[
                        <path key="a" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>,
                        <path key="b" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9"/>,
                        <><circle key="c1" cx="12" cy="12" r="3"/><path key="c2" d="M12 1v4M12 19v4"/></>,
                        <path key="d" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      ].map((icon, i) => (
                        <div key={i} className={`w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-text-tertiary ${i === 0 ? 'bg-background3 text-text-secondary' : ''}`}>
                          <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{icon}</svg>
                        </div>
                      ))}
                    </div>
                    {/* conversation list */}
                    <div className="flex-1 overflow-hidden">
                      <div className="px-[1rem] py-[0.8rem] pb-[0.6rem] border-b border-border flex items-center justify-between">
                        <span className="text-[0.72rem] font-medium text-text-primary">All conversations</span>
                        <span className="text-[0.58rem] bg-background4 border border-border rounded-[10px] px-[8px] py-[2px] text-text-tertiary">142 this week</span>
                      </div>
                      {[
                        { init: 'ZN', grad: 'linear-gradient(135deg,#667eea,#764ba2)', name: 'zaynab.nour', preview: null, time: 'now', dot: true, typing: true },
                        { init: 'LM', grad: 'linear-gradient(135deg,#f093fb,#f5576c)', name: 'lina.maged', preview: 'Do you have this in black?', time: '2m', dot: false, typing: false },
                        { init: 'SR', grad: 'linear-gradient(135deg,#4facfe,#00f2fe)', name: 'sara.rami', preview: "What's the return policy?", time: '5m', dot: false, typing: false },
                        { init: 'NA', grad: 'linear-gradient(135deg,#43e97b,#38f9d7)', name: 'nour.ali', preview: 'When will size M restock?', time: '8m', dot: false, typing: false },
                        { init: 'YK', grad: 'linear-gradient(135deg,#fa709a,#fee140)', name: 'yasmin.k', preview: 'Order confirmed! Thank you', time: '12m', dot: false, typing: false },
                        { init: 'DM', grad: 'linear-gradient(135deg,#f7971e,#ffd200)', name: 'dina.m', preview: 'Is express shipping available?', time: '18m', dot: false, typing: false },
                      ].map((row, i) => (
                        <div key={i} className={`flex items-center gap-[0.65rem] px-[1rem] py-[0.75rem] border-b border-border ${i === 0 ? 'bg-background3' : ''}`}>
                          <div className="w-[28px] h-[28px] rounded-full shrink-0 flex items-center justify-center text-[0.52rem] font-bold text-white" style={{ background: row.grad }}>{row.init}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[0.7rem] font-medium text-text-primary mb-[2px]">{row.name}</div>
                            {row.typing ? (
                              <div className="flex items-center gap-1 text-[0.6rem] text-text-tertiary">
                                <span className="w-[4px] h-[4px] rounded-full bg-[#3dbb77] shadow-[0_0_4px_rgba(61,187,119,0.6)] animate-pulse" />
                                Luna is replying
                                <span className="flex gap-[2px]">
                                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                                </span>
                              </div>
                            ) : (
                              <div className="text-[0.62rem] text-text-tertiary truncate">{row.preview}</div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-[3px] shrink-0">
                            <span className="text-[0.58rem] text-text-tertiary">{row.time}</span>
                            {row.dot && <span className="w-[6px] h-[6px] rounded-full bg-[#3d8bff]" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* FRONT: Instagram phone */}
                <div className="demo-phone absolute bottom-0 left-[20px] z-[3] rounded-[26px] overflow-hidden" style={{ width: '210px', background: ph.bg, border: ph.border }}>

                  {/* IG topbar */}
                  <div className="border-b flex items-center gap-[0.45rem] px-[0.75rem] py-[0.6rem]" style={{ background: ph.topbar, borderColor: ph.topBorder }}>
                    <svg className="w-[15px] h-[15px] shrink-0" style={{ color: ph.backArrow }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                    <div className="relative w-[28px] h-[28px] shrink-0">
                      <div className="absolute inset-[-2px] rounded-full" style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }} />
                      <div className="absolute inset-[1.5px] rounded-full" style={{ background: ph.topbar }} />
                      <div className="absolute inset-[3.5px] rounded-full flex items-center justify-center text-[0.42rem] font-bold text-white" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>ZN</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.64rem] font-semibold" style={{ color: ph.name }}>zaynab.nour</div>
                      <div className="text-[0.52rem]" style={{ color: ph.sub }}>Active now</div>
                    </div>
                    <div className="flex items-center gap-[4px] rounded-[20px] px-[7px] py-[3px] text-[0.5rem] font-medium" style={{ background: ph.lunaChip.bg, border: `1px solid ${ph.lunaChip.border}`, color: ph.lunaChip.color }}>
                      <span className="w-[5px] h-[5px] rounded-full bg-[#3dbb77] animate-pulse" />
                      Luna
                    </div>
                  </div>

                  {/* chat body */}
                  <div ref={chatRef} className="demo-chat-body px-[0.65rem] py-[0.65rem] pb-[0.5rem] flex flex-col gap-[0.45rem] overflow-hidden" style={{ background: ph.bg, height: '280px' }} />

                  {/* input bar */}
                  <div className="flex items-center gap-[0.5rem] px-[0.65rem] py-[0.55rem] border-t" style={{ background: ph.topbar, borderColor: ph.topBorder }}>
                    <svg className="w-[17px] h-[17px] shrink-0" style={{ color: ph.icon }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <div className="flex-1 rounded-[20px] flex items-center px-3 py-[5px]" style={{ border: `1px solid ${ph.inputBorder}` }}>
                      <span className="text-[0.56rem] flex-1" style={{ color: ph.placeholder }}>Message...</span>
                    </div>
                    <svg className="w-[17px] h-[17px] shrink-0" style={{ color: ph.icon }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex justify-center border-t border-border">
            <div className="stats-strip-grid">
              {[
                { num: '~0s', label: 'Response time' },
                { num: '24/7', label: 'Coverage' },
                { num: '100%', label: 'Consistency' },
                { num: '∞', label: 'Scale' },
              ].map((s, i) => (
                <div key={i} className={`text-center px-9 py-5 ${i < 3 ? 'border-r border-border' : ''}`}>
                  <div className="text-[1.2rem] font-light tracking-[-0.04em]">{s.num}</div>
                  <div className="text-[0.63rem] text-text-tertiary tracking-[0.05em] uppercase mt-[2px]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── INTEGRATIONS STRIP ── */}
        <div className="border-t border-b border-border py-[1.4rem] px-8 flex items-center justify-center gap-[0.6rem] flex-wrap">
          <span className="text-[0.62rem] uppercase tracking-[0.1em] text-text-tertiary mr-[0.8rem] whitespace-nowrap">Integrates with</span>

          {/* Instagram */}
          <div className="integ-logo-item">
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
              <defs><linearGradient id="ig-g2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig-g2)" strokeWidth="1.8"/>
              <circle cx="12" cy="12" r="4" stroke="url(#ig-g2)" strokeWidth="1.8"/>
              <circle cx="17.5" cy="6.5" r="1" fill="url(#ig-g2)"/>
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

        {/* Products Section */}
        <div className="py-24 px-8 max-w-[960px] mx-auto" id="products">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">Krew — First Product</div>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] mb-1">Luna</h2>
              <p className="text-[0.65rem] text-text-tertiary tracking-[0.07em] uppercase mb-[0.9rem]">Customer Operations Agent by Krew</p>
              <p className="text-[0.8rem] text-text-secondary leading-[1.8] font-light">
                Not a chatbot. Luna is a fully operational AI agent handling Instagram and WhatsApp DMs with your brand's tone — managing orders, guiding product decisions, and escalating when needed.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-[1px] bg-border border border-border rounded-[12px] overflow-hidden">
              {[
                { title: 'IG & WhatsApp', body: 'Brand-native responses across every channel.', icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/> },
                { title: 'Order Flow', body: 'Structured data capture from every conversation.', icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/> },
                { title: 'Escalation', body: 'Complex cases handed off with full context.', icon: <path d="M13 10V3L4 14h7v7l9-11h-7z"/> },
                { title: 'Reports', body: 'Weekly behavior and inquiry summaries.', icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/> },
              ].map((card) => (
                <div key={card.title} className="bg-background p-[1.6rem] hover:bg-background3 transition-colors duration-200">
                  <div className="w-[26px] h-[26px] border border-border rounded-[6px] flex items-center justify-center text-text-tertiary mb-4">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{card.icon}</svg>
                  </div>
                  <div className="text-[0.78rem] font-medium text-text-primary mb-[0.4rem]">{card.title}</div>
                  <div className="text-[0.72rem] text-text-secondary leading-[1.6] font-light">{card.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-border" />

        {/* Intelligence Section */}
        <div className="py-24 px-8 max-w-[960px] mx-auto">
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

        {/* Vision Section */}
        <div className="py-24 px-8 max-w-[960px] mx-auto" id="vision">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">The Krew Ecosystem</div>
          <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] max-w-[540px] mb-[0.9rem]">
            One company.<br />A growing family of agents.
          </h2>
          <p className="text-[0.8rem] text-text-secondary leading-[1.8] max-w-[460px] font-light mb-10">
            Luna is the first product under Krew. A full pipeline of named, specialized agents is being built — each one covering a different layer of your brand operations.
          </p>
          <div className="border border-border rounded-[10px] overflow-hidden flex flex-col gap-[1px] bg-border">
            <div className="bg-background p-[1.1rem] px-6 flex items-center justify-between text-[0.75rem] text-text-primary hover:bg-background3 transition-colors duration-150">
              <div className="flex items-center gap-[0.7rem]">
                <span>Luna</span>
                <span className="text-[0.58rem] uppercase tracking-[0.06em] text-text-secondary border border-border-md rounded px-[6px] py-[2px]">Live</span>
              </div>
              <div className="flex items-center gap-[0.7rem]">
                <span className="text-[0.68rem] text-text-tertiary">Customer Operations</span>
                <div className="w-[5px] h-[5px] rounded-full bg-text-secondary shadow-[0_0_5px_var(--text-secondary)] animate-pulse" />
              </div>
            </div>
            {[
              { name: 'Ivy', role: 'Financial Visibility' },
              { name: '—', role: 'Performance Reporting' },
              { name: '—', role: 'Marketing Intelligence' },
            ].map((item) => (
              <div key={item.name + item.role} className="bg-background p-[1.1rem] px-6 flex items-center justify-between text-[0.75rem] text-text-secondary hover:bg-background3 transition-colors duration-150">
                <div className="flex items-center gap-[0.7rem]">
                  <span>{item.name}</span>
                  <span className="text-[0.58rem] uppercase tracking-[0.06em] text-text-tertiary border border-border rounded px-[6px] py-[2px]">Soon</span>
                </div>
                <span className="text-[0.68rem] text-text-tertiary">{item.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ teaser — links to /faq */}
        <div className="py-20 px-8 max-w-[960px] mx-auto text-center" id="faq">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">FAQ</div>
          <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] mb-4">
            Have questions?
          </h2>
          <p className="text-[0.8rem] text-text-secondary font-light mb-8 max-w-[400px] mx-auto leading-[1.8]">
            We've answered the most common ones about Luna, pricing, and integrations.
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 border border-border text-text-secondary px-[22px] py-[9px] rounded-[8px] text-[0.78rem] hover:border-border-hover hover:text-text-primary transition-all duration-200"
          >
            Browse FAQ
            <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        <div className="h-[1px] bg-border" />

        {/* CTA Section */}
        <div className="text-center border-b border-border py-20 px-8">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">Early Access</div>
          <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] mx-auto mb-[0.9rem]">
            Start with Luna.<br />Scale with Krew.
          </h2>
          <p className="text-[0.8rem] text-text-secondary leading-[1.8] max-w-[460px] font-light mx-auto mb-8">
            We're onboarding select brands into Luna now. Be among the first to turn your inbox into an operation.
          </p>
          <div className="flex justify-center gap-[0.7rem]">
            <Link href="/auth/signup" className="bg-btn-bg text-btn-text px-[22px] py-[9px] rounded-[8px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity duration-200">
              Request access
            </Link>
            <button className="border border-border text-text-secondary px-[22px] py-[9px] rounded-[8px] text-[0.78rem] hover:border-border-hover hover:text-text-primary transition-all duration-200">
              Talk to the team
            </button>
          </div>
        </div>

        <footer className="border-t border-border mt-0">
          <div className="max-w-[960px] mx-auto px-8 py-16 grid footer-grid gap-12">

            {/* Brand col */}
            <div className="flex flex-col gap-4">
              <div className="text-[0.82rem] font-semibold tracking-[0.1em] uppercase text-text-primary">Krew</div>
              <p className="text-[0.72rem] text-text-tertiary leading-[1.75] max-w-[200px]">
                AI agents built for brand operations. Starting with customer service.
              </p>
              <div className="text-[0.65rem] text-text-tertiary mt-auto pt-4">© 2026 Krew Systems. All rights reserved.</div>
            </div>

            {/* Quick Menu */}
            <div className="flex flex-col gap-3">
              <div className="text-[0.62rem] uppercase tracking-[0.12em] text-text-tertiary mb-1">Quick Menu</div>
              {[
                { label: 'How it works', href: '#products' },
                { label: 'Features', href: '#products' },
                { label: 'Vision', href: '#vision' },
                { label: 'FAQ', href: '/faq' },
              ].map((l) => (
                <a key={l.label} href={l.href} className="text-[0.73rem] text-text-secondary hover:text-text-primary transition-colors duration-150">{l.label}</a>
              ))}
            </div>

            {/* Information */}
            <div className="flex flex-col gap-3">
              <div className="text-[0.62rem] uppercase tracking-[0.12em] text-text-tertiary mb-1">Information</div>
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Luna Agent', href: '/agents/luna' },
              ].map((l) => (
                <a key={l.label} href={l.href} className="text-[0.73rem] text-text-secondary hover:text-text-primary transition-colors duration-150">{l.label}</a>
              ))}
            </div>

            {/* Support */}
            <div className="flex flex-col gap-3">
              <div className="text-[0.62rem] uppercase tracking-[0.12em] text-text-tertiary mb-1">Support</div>
              <a href="mailto:support@mykrew.co" className="text-[0.73rem] text-text-secondary hover:text-text-primary transition-colors duration-150">support@mykrew.co</a>
              <a href="mailto:privacy@mykrew.co" className="text-[0.73rem] text-text-secondary hover:text-text-primary transition-colors duration-150">privacy@mykrew.co</a>
              <Link href="/auth/signup" className="text-[0.73rem] text-text-secondary hover:text-text-primary transition-colors duration-150">Get early access</Link>
            </div>

          </div>
        </footer>
      </div>

      <style jsx>{`
        /* Footer grid */
        .footer-grid {
          grid-template-columns: 2fr 1fr 1fr 1fr;
        }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr; }
        }

        /* Hero split grid */
        .hero-grid {
          grid-template-columns: 52% 48%;
        }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; }
          .hero-right { padding: 0 0 2.5rem; justify-content: center; }
          .demo-wrap { max-width: 300px; margin: 0 auto; }
        }
        @media (max-width: 640px) {
          .hero-grid { padding: 0 1.2rem; gap: 0; }
          .hero-left { padding: 2.5rem 0 2rem; }
          .hero-right { padding: 0 0 2.5rem; }
          .demo-wrap { width: calc(100vw - 2.4rem); max-width: 420px; }
        }

        .stats-strip-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 640px) {
          .stats-strip-grid { grid-template-columns: 1fr 1fr; }
        }

        /* Luna live dot */
        .luna-dot {
          display: inline-block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #3dbb77;
          box-shadow: 0 0 5px rgba(61,187,119,0.5);
          animation: pulse 2s infinite;
          flex-shrink: 0;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

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

        /* Demo chat bubbles */
        :global(.demo-dm-ts) {
          text-align: center; font-size: 0.46rem;
          color: rgba(255,255,255,0.3); margin: 0.1rem 0;
        }
        :global(.demo-dm-row) {
          display: flex; gap: 0.3rem; align-items: flex-end;
          animation: msgIn 0.25s ease both;
        }
        :global(.demo-dm-row.out) { justify-content: flex-end; flex-direction: column; align-items: flex-end; }
        :global(.demo-luna-lbl) {
          font-size: 0.43rem; color: rgba(255,255,255,0.28);
          letter-spacing: 0.04em; margin-bottom: 1px; padding-right: 2px;
        }
        :global(.demo-dm-avatar) {
          width: 16px; height: 16px; border-radius: 50%;
          background: linear-gradient(135deg,#667eea,#764ba2);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.34rem; font-weight: 700; color: #fff; flex-shrink: 0; margin-bottom: 1px;
        }
        :global(.demo-dm-bubble) {
          max-width: 115px; padding: 0.38rem 0.55rem;
          font-size: 0.56rem; line-height: 1.45; border-radius: 16px;
        }
        :global(.demo-dm-bubble.in) { background: #262626; color: #fff; border-bottom-left-radius: 4px; }
        :global(.demo-dm-bubble.out) {
          background: linear-gradient(135deg,#c13584,#e1306c 40%,#fd5949 75%,#ffcd67);
          color: #fff; border-bottom-right-radius: 4px;
        }
        :global(.demo-dm-typing) {
          display: flex; align-items: center; gap: 2px;
          padding: 0.38rem 0.55rem; background: #262626;
          border-radius: 16px; border-bottom-left-radius: 4px; width: fit-content;
        }
        :global(.demo-dm-typing span) {
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(255,255,255,0.45);
          animation: typingBounce 1.2s infinite ease-in-out;
        }
        :global(.demo-dm-typing span:nth-child(2)) { animation-delay: 0.18s; }
        :global(.demo-dm-typing span:nth-child(3)) { animation-delay: 0.36s; }
        @keyframes msgIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
