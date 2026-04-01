'use client';

import { useState } from 'react';
import Link from 'next/link';

type Category = 'general' | 'luna' | 'pricing' | 'integrations';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_DATA: Record<Category, FaqItem[]> = {
  general: [
    {
      q: 'What is Krew?',
      a: 'Krew is an AI agent platform built for e-commerce and consumer brands. Each agent in your Krew handles a specific operational role — from managing customer conversations to giving you financial clarity — so your team can focus on what matters.',
    },
    {
      q: 'Who is Krew built for?',
      a: 'Krew is built for growing brands that sell online, particularly those receiving high volumes of customer messages through Instagram and WhatsApp DMs. If your team is spending hours answering repetitive questions or missing orders in the inbox, Krew is for you.',
    },
    {
      q: 'How quickly can I get started?',
      a: 'Most brands are live within 48 hours. The onboarding flow captures your brand tone and key information, integrations connect in minutes, and your first agent starts handling operations from day one.',
    },
    {
      q: 'Do I need technical knowledge to use Krew?',
      a: 'No engineering required. Krew is designed for operators and brand owners. Connecting your channels, configuring your agent, and reviewing conversations all happen through a clean dashboard — no code involved.',
    },
  ],
  luna: [
    {
      q: 'What is Luna?',
      a: "Luna is an AI agent built for customer-facing brand operations. It handles Instagram and WhatsApp DMs autonomously — answering product questions, guiding orders, and escalating complex cases to your team — all in your brand's voice.",
    },
    {
      q: 'Can I control what Luna says?',
      a: 'Yes. Through the Knowledge Base, you define the answers to common questions. Luna uses these alongside your product catalog to respond accurately. You can also review and override any conversation at any time.',
    },
    {
      q: "What happens when Luna can't handle a conversation?",
      a: 'Luna escalates it. When a conversation needs a human, Luna flags it and hands it off with full context — the entire message history, product inquiry, and reason for escalation — so your team can step in seamlessly.',
    },
    {
      q: 'Can I see what Luna is saying to my customers?',
      a: "Yes. Every conversation Luna handles is visible in real time in your Conversations tab. You can read every message, take over any thread at any time, and toggle Luna on or off per conversation — you're always in control.",
    },
    {
      q: 'What languages does Luna support?',
      a: 'Luna can communicate in any language your customers write in. It automatically detects the language of the incoming message and responds accordingly, while staying consistent with your brand tone.',
    },
  ],
  pricing: [
    {
      q: 'Is there a free trial or setup fee?',
      a: "We're currently in early access. Selected brands get a guided onboarding with no upfront setup fee. Pricing is structured around usage and scales with your operation. Request access to learn more.",
    },
    {
      q: 'How is Krew priced?',
      a: "Pricing is usage-based and scales with your operation — you're not paying for seats, you're paying for outcomes. Plans are designed to grow with you from early-stage to high-volume. Full pricing details are shared during onboarding.",
    },
    {
      q: 'Are there any long-term contracts?',
      a: "No lock-in. We're building for operators who need results, not commitment. You can adjust or cancel your plan at any time. We earn your continued use by delivering consistent value.",
    },
  ],
  integrations: [
    {
      q: 'How does Luna connect to my Instagram and WhatsApp?',
      a: 'Luna connects through the official Meta Business API. Once you grant access in your Integrations page, Luna starts receiving and responding to messages in real time — no custom dev work required.',
    },
    {
      q: 'Does Krew integrate with Shopify?',
      a: 'Yes. Connect your Shopify store from the Integrations page and Luna will have access to your product catalog, order status, and inventory — so it can answer questions like "is size M in stock?" or "where is my order?" accurately.',
    },
    {
      q: 'Do you support other delivery providers?',
      a: "We currently integrate with Bosta for delivery tracking. Additional courier integrations are on the roadmap. If you're using a specific provider, reach out — we prioritize integrations based on demand.",
    },
    {
      q: 'Can I connect multiple Instagram accounts or WhatsApp numbers?',
      a: 'Multi-account support is available on higher-tier plans. If you manage more than one brand or storefront, contact us to discuss the right setup for your operation.',
    },
  ],
};

const TABS: { label: string; value: Category }[] = [
  { label: 'General', value: 'general' },
  { label: 'Luna', value: 'luna' },
  { label: 'Pricing', value: 'pricing' },
  { label: 'Integrations', value: 'integrations' },
];

function PlusIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="w-[16px] h-[16px] shrink-0 text-text-tertiary transition-transform duration-300"
      style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function FaqPage() {
  const [activeTab, setActiveTab] = useState<Category>('general');
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  const handleTabChange = (tab: Category) => {
    setActiveTab(tab);
    setOpenIndices(new Set());
  };

  const toggleIndex = (i: number) => {
    setOpenIndices(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const items = FAQ_DATA[activeTab];

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-24 pb-24 px-6">
        <div className="max-w-[760px] mx-auto">

          {/* Page heading */}
          <div className="mb-10 text-center">
            <h1 className="text-[clamp(1.6rem,4vw,2.4rem)] font-light tracking-[-0.03em] text-text-primary leading-[1.15] mb-3">
              Frequently asked questions
            </h1>
            <p className="text-[0.8rem] text-text-secondary font-light">
              Can't find what you're looking for?{' '}
              <Link href="/auth/signup" className="text-text-primary underline underline-offset-2 hover:opacity-70 transition-opacity duration-150">
                Talk to us
              </Link>
            </p>
          </div>

          {/* Tab switcher — white pill capsule */}
          <div className="flex justify-center mb-10">
            <div className="bg-background border border-border rounded-full px-[5px] py-[5px] flex items-center gap-[2px]">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`px-[16px] py-[7px] rounded-full text-[0.75rem] font-[450] tracking-[-0.01em] transition-all duration-200 ${
                    activeTab === tab.value
                      ? 'bg-btn-bg text-btn-text'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion */}
          <div>
            {items.map((item, i) => {
              const isOpen = openIndices.has(i);
              return (
                <div key={i} className="border-b border-border last:border-b-0">
                  <button
                    onClick={() => toggleIndex(i)}
                    className="w-full flex items-center justify-between gap-6 py-[1.35rem] text-left group"
                  >
                    <span className={`text-[1rem] font-light tracking-[-0.01em] leading-snug transition-colors duration-150 ${isOpen ? 'text-text-primary' : 'text-text-primary group-hover:text-text-secondary'}`}>
                      {item.q}
                    </span>
                    <PlusIcon open={isOpen} />
                  </button>

                  {/* Answer — animated height via grid trick for reliable animation */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isOpen ? '400px' : '0px' }}
                  >
                    <p className="pb-[1.35rem] text-[0.82rem] text-text-secondary leading-[1.9] font-light pr-8">
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}
