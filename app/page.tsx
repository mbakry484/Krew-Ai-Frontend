'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function LandingPage() {
  const scrollToSection = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-12">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 flex items-center justify-center flex-col text-center px-8 py-20 gap-[1.1rem]">
            <div className="inline-flex items-center gap-[6px] bg-tag-bg border border-border rounded-[20px] px-3 py-1 text-[0.7rem] text-text-secondary tracking-[0.04em] uppercase before:content-[''] before:w-[5px] before:h-[5px] before:rounded-full before:bg-text-tertiary animate-fadeUp">
              A Krew product
            </div>
            <h1 className="text-[clamp(2.4rem,5vw,4.2rem)] font-light tracking-[-0.035em] leading-[1.05] text-text-primary max-w-[680px] animate-fadeUp animation-delay-100">
              Luna
            </h1>
            <p className="text-[0.72rem] text-text-tertiary tracking-[0.09em] uppercase animate-fadeUp animation-delay-200">
              Customer Operations Agent
            </p>
            <p className="text-[0.83rem] text-text-secondary max-w-[390px] leading-[1.75] font-light animate-fadeUp animation-delay-300">
              Your brand's inbox, fully operated. Luna handles Instagram and WhatsApp DMs with your tone — guiding customers, managing orders, and turning conversations into intelligence.
            </p>
            <div className="flex gap-[0.7rem] mt-[0.3rem] animate-fadeUp animation-delay-400">
              <Link
                href="/auth/signup"
                className="bg-btn-bg text-btn-text px-[22px] py-[9px] rounded-[8px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity duration-200"
              >
                Get early access
              </Link>
              <button
                onClick={() => scrollToSection('#products')}
                className="border border-border text-text-secondary px-[22px] py-[9px] rounded-[8px] text-[0.78rem] hover:border-border-hover hover:text-text-primary transition-all duration-200"
              >
                Learn more
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center p-8 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 max-md:w-full">
              <div className="text-center px-12 border-r border-border max-md:border-b max-md:py-5">
                <div className="text-[1.5rem] font-light tracking-[-0.04em]">~0s</div>
                <div className="text-[0.68rem] text-text-tertiary tracking-[0.05em] uppercase mt-[2px]">Response time</div>
              </div>
              <div className="text-center px-12 md:border-r border-border max-md:border-b max-md:py-5 max-md:border-r-0">
                <div className="text-[1.5rem] font-light tracking-[-0.04em]">24/7</div>
                <div className="text-[0.68rem] text-text-tertiary tracking-[0.05em] uppercase mt-[2px]">Coverage</div>
              </div>
              <div className="text-center px-12 border-r border-border max-md:py-5">
                <div className="text-[1.5rem] font-light tracking-[-0.04em]">100%</div>
                <div className="text-[0.68rem] text-text-tertiary tracking-[0.05em] uppercase mt-[2px]">Consistency</div>
              </div>
              <div className="text-center px-12 max-md:py-5 max-md:border-r-0">
                <div className="text-[1.5rem] font-light tracking-[-0.04em]">∞</div>
                <div className="text-[0.68rem] text-text-tertiary tracking-[0.05em] uppercase mt-[2px]">Scale</div>
              </div>
            </div>
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
              <div className="bg-background p-[1.6rem] hover:bg-background3 transition-colors duration-200">
                <div className="w-[26px] h-[26px] border border-border rounded-[6px] flex items-center justify-center text-text-tertiary mb-4">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                  </svg>
                </div>
                <div className="text-[0.78rem] font-medium text-text-primary mb-[0.4rem]">IG & WhatsApp</div>
                <div className="text-[0.72rem] text-text-secondary leading-[1.6] font-light">Brand-native responses across every channel.</div>
              </div>
              <div className="bg-background p-[1.6rem] hover:bg-background3 transition-colors duration-200">
                <div className="w-[26px] h-[26px] border border-border rounded-[6px] flex items-center justify-center text-text-tertiary mb-4">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div className="text-[0.78rem] font-medium text-text-primary mb-[0.4rem]">Order Flow</div>
                <div className="text-[0.72rem] text-text-secondary leading-[1.6] font-light">Structured data capture from every conversation.</div>
              </div>
              <div className="bg-background p-[1.6rem] hover:bg-background3 transition-colors duration-200">
                <div className="w-[26px] h-[26px] border border-border rounded-[6px] flex items-center justify-center text-text-tertiary mb-4">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div className="text-[0.78rem] font-medium text-text-primary mb-[0.4rem]">Escalation</div>
                <div className="text-[0.72rem] text-text-secondary leading-[1.6] font-light">Complex cases handed off with full context.</div>
              </div>
              <div className="bg-background p-[1.6rem] hover:bg-background3 transition-colors duration-200">
                <div className="w-[26px] h-[26px] border border-border rounded-[6px] flex items-center justify-center text-text-tertiary mb-4">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <div className="text-[0.78rem] font-medium text-text-primary mb-[0.4rem]">Reports</div>
                <div className="text-[0.72rem] text-text-secondary leading-[1.6] font-light">Weekly behavior and inquiry summaries.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
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

        {/* Divider */}
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
            <div className="bg-background p-[1.1rem] px-6 flex items-center justify-between text-[0.75rem] text-text-secondary hover:bg-background3 transition-colors duration-150">
              <div className="flex items-center gap-[0.7rem]">
                <span>Ivy</span>
                <span className="text-[0.58rem] uppercase tracking-[0.06em] text-text-tertiary border border-border rounded px-[6px] py-[2px]">Soon</span>
              </div>
              <span className="text-[0.68rem] text-text-tertiary">Financial Visibility</span>
            </div>
            <div className="bg-background p-[1.1rem] px-6 flex items-center justify-between text-[0.75rem] text-text-secondary hover:bg-background3 transition-colors duration-150">
              <div className="flex items-center gap-[0.7rem]">
                <span>—</span>
                <span className="text-[0.58rem] uppercase tracking-[0.06em] text-text-tertiary border border-border rounded px-[6px] py-[2px]">Soon</span>
              </div>
              <span className="text-[0.68rem] text-text-tertiary">Performance Reporting</span>
            </div>
            <div className="bg-background p-[1.1rem] px-6 flex items-center justify-between text-[0.75rem] text-text-secondary hover:bg-background3 transition-colors duration-150">
              <div className="flex items-center gap-[0.7rem]">
                <span>—</span>
                <span className="text-[0.58rem] uppercase tracking-[0.06em] text-text-tertiary border border-border rounded px-[6px] py-[2px]">Soon</span>
              </div>
              <span className="text-[0.68rem] text-text-tertiary">Marketing Intelligence</span>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="py-24 px-8 max-w-[960px] mx-auto" id="contact">
          <div className="text-[0.65rem] uppercase tracking-[0.1em] text-text-tertiary mb-[1.4rem]">Get in Touch</div>
          <h2 className="text-[clamp(1.3rem,3vw,1.9rem)] font-light tracking-[-0.025em] leading-[1.2] max-w-[540px] mb-[0.9rem]">
            Questions? Let's talk.
          </h2>
          <p className="text-[0.8rem] text-text-secondary leading-[1.8] max-w-[460px] font-light mb-10">
            Our team is ready to help you understand how Luna can transform your customer operations. Reach out with any questions.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="mb-6">
                <h3 className="text-[0.85rem] font-medium text-text-primary mb-[0.5rem]">Email</h3>
                <a href="mailto:hello@krew.ai" className="text-[0.75rem] text-text-secondary hover:text-text-primary transition-colors duration-200">
                  hello@krew.ai
                </a>
              </div>
              <div className="mb-6">
                <h3 className="text-[0.85rem] font-medium text-text-primary mb-[0.5rem]">Location</h3>
                <p className="text-[0.75rem] text-text-secondary">
                  San Francisco, CA<br />United States
                </p>
              </div>
              <div>
                <h3 className="text-[0.85rem] font-medium text-text-primary mb-[0.5rem]">Hours</h3>
                <p className="text-[0.75rem] text-text-secondary">
                  Monday — Friday<br />9:00 AM — 6:00 PM PT
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-[0.75rem] text-text-tertiary">Ready to get started?</p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center bg-btn-bg text-btn-text px-[22px] py-[9px] rounded-[8px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity duration-200 w-full"
              >
                Request early access
              </Link>
              <button className="border border-border text-text-secondary px-[22px] py-[9px] rounded-[8px] text-[0.78rem] hover:border-border-hover hover:text-text-primary transition-all duration-200 w-full">
                Schedule a demo
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
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
            <Link
              href="/auth/signup"
              className="bg-btn-bg text-btn-text px-[22px] py-[9px] rounded-[8px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity duration-200"
            >
              Request access
            </Link>
            <button className="border border-border text-text-secondary px-[22px] py-[9px] rounded-[8px] text-[0.78rem] hover:border-border-hover hover:text-text-primary transition-all duration-200">
              Talk to the team
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-7 px-8 max-w-[960px] mx-auto flex items-center justify-between max-md:flex-col max-md:gap-2 max-md:text-center">
          <div className="text-[0.75rem] font-medium tracking-[0.07em] uppercase text-text-tertiary">Krew</div>
          <div className="text-[0.68rem] text-text-tertiary">Luna · Customer Operations Agent</div>
          <div className="text-[0.68rem] text-text-tertiary">© 2025 Krew. All rights reserved.</div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeUp {
          animation: fadeUp 0.6s ease both;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </>
  );
}