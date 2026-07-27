import Link from 'next/link';
import { AGENTS } from '@/lib/agents';

// Site footer, extracted from the landing page (Phase 1). Blurb comes from
// content/COPY.md ("Footer"); agent links render from the registry.
export default function Footer() {
  return (
    <footer className="border-t border-border mt-0">
      <div className="max-w-[960px] mx-auto px-8 py-24 grid footer-grid gap-12">

        {/* Brand col */}
        <div className="flex flex-col gap-4">
          <div className="text-[0.82rem] font-semibold tracking-[0.1em] uppercase text-text-primary">Krew</div>
          <p className="text-[0.72rem] text-text-tertiary leading-[1.75] max-w-[200px]">
            AI agents that run your brand&apos;s operations. Built for MENA e-commerce.
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

        {/* Agents — from the registry */}
        <div className="flex flex-col gap-3">
          <div className="text-[0.62rem] uppercase tracking-[0.12em] text-text-tertiary mb-1">Agents</div>
          {AGENTS.map((agent) => (
            <Link key={agent.slug} href={agent.href} className="text-[0.73rem] text-text-secondary hover:text-text-primary transition-colors duration-150">
              {agent.name}
            </Link>
          ))}
        </div>

        {/* Information */}
        <div className="flex flex-col gap-3">
          <div className="text-[0.62rem] uppercase tracking-[0.12em] text-text-tertiary mb-1">Information</div>
          {[
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
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
  );
}
