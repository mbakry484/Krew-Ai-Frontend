'use client';

import { useTheme } from '@/components/ThemeProvider';
import Hero from '@/components/landing/Hero';
import CrewSection from '@/components/landing/CrewSection';
import SpotlightSection from '@/components/landing/SpotlightSection';
import BetaAgentSection from '@/components/landing/BetaAgentSection';
import CrewThesisSection from '@/components/landing/CrewThesisSection';
import ClosingCtaSection from '@/components/landing/ClosingCtaSection';
import Footer from '@/components/Footer';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// This is a static landing page — no API calls required.
// Every section renders from lib/agents.ts + the content/* configs. The spine
// (Phase 2): hero (live agent) → crew reveal → live-agent spotlight → beta-agent
// section → crew thesis → closing CTA. Launches rotate by registry state.
// =============================================================================

export default function LandingPage() {
  const { theme } = useTheme();
  const dk = theme === 'dark';

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

        {/* ── BETA AGENT — compressed beta beat: the overnight inbox wall,
              reframed from the registry's beta agent (Phase 2.4) ── */}
        <BetaAgentSection />

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

        {/* ── CREW THESIS — one operation, shared context (Phase 2.5) ── */}
        <CrewThesisSection />

        {/* ── CLOSING CTA — the finale, names from the registry (Phase 2.6) ── */}
        <ClosingCtaSection />

        <Footer />
      </div>

      <style jsx>{`
        /* Integration logos */
        .integ-logo-item {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 5px 12px; border: 1px solid var(--border);
          border-radius: 8px; background: var(--bg2);
          font-size: 0.67rem; font-weight: 500; color: var(--text-secondary);
          white-space: nowrap; transition: border-color 0.2s, color 0.2s;
        }
        .integ-logo-item:hover { border-color: var(--border-md); color: var(--text-primary); }
      `}</style>
    </>
  );
}
