import Hero from '@/components/landing/Hero';
import PocketSection from '@/components/landing/PocketSection';
import CrewSection from '@/components/landing/CrewSection';
import SpotlightSection from '@/components/landing/SpotlightSection';
import BetaAgentSection from '@/components/landing/BetaAgentSection';
import IntegrationsSection from '@/components/landing/IntegrationsSection';
import CrewThesisSection from '@/components/landing/CrewThesisSection';
import ClosingCtaSection from '@/components/landing/ClosingCtaSection';
import Footer from '@/components/Footer';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// This is a static landing page — no API calls required.
// Every section renders from lib/agents.ts + the content/* configs. The spine
// (Phase 2): hero (live agent) → crew reveal → live-agent spotlight → beta-agent
// section → integrations → crew thesis → closing CTA. Launches rotate by
// registry state. Each section is its own client component; this page is a
// plain server-side composition.
// =============================================================================

export default function LandingPage() {
  return (
    <div id="landing" className="min-h-screen pt-20">

      {/* ── HERO — registry-driven, rotates with the live agent (Phase 2.1) ── */}
      <Hero />

      {/* ── POCKET BEAT — asset-driven Ivy moment: the phone rises, the
            punchline is uncovered from behind it on scroll ── */}
      <PocketSection />

      {/* ── CREW REVEAL — permanent brand layer (Phase 2.2) ── */}
      <CrewSection />

      {/* ── SPOTLIGHT — the live agent's main-character beat: the wedge,
            the return dial, a short team recap (Phase 2.3) ── */}
      <SpotlightSection />

      {/* ── BETA AGENT — full-width bold-dark pattern-break: the beta agent's
            aura, mascot, and overnight inbox (Phase 2.4) ── */}
      <BetaAgentSection />

      {/* ── INTEGRATIONS — hexagon hub, centre-out blur-fade ── */}
      <IntegrationsSection />

      {/* ── CREW THESIS — one operation, shared context (Phase 2.5) ── */}
      <CrewThesisSection />

      {/* ── CLOSING CTA — the finale, names from the registry (Phase 2.6) ── */}
      <ClosingCtaSection />

      <Footer />
    </div>
  );
}
