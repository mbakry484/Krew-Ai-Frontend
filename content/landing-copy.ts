// =============================================================================
// BRAND-LEVEL LANDING COPY — the homepage's non-agent strings (KREW-RELAUNCH
// 2.5 crew thesis + 2.6 closing CTA). Like content/agent-content.ts this is a
// sanctioned home for copy, so the crew-thesis manifesto (which names all three
// agents by design) lives here rather than being hardcoded in a component.
//
// Every string is verbatim from content/COPY.md. The closing CTA's agent names
// are NOT stored here — components interpolate them from the registry so the
// finale rotates with launch state (Start with <live>, Request <beta> invite).
// =============================================================================

/** COPY.md HOMEPAGE › "Telegram beat" (section 4 — the scroll stepper). Names
 *  all three agents by design, so it lives here rather than in the component. */
export const TELEGRAM_SECTION = {
  eyebrow: 'YOUR CREW, ON TELEGRAM',
  headline: 'Your agents are employees you talk to.',
  steps: [
    {
      img: '/hero/01_give_orders_iphone.png',
      tag: 'GIVE ORDERS',
      title: 'Just tell them what to do.',
      body: 'Forward a receipt, drop a note — "log this." Ivy files it to the right budget and confirms.',
    },
    {
      img: '/hero/02_luna_reports_back_iphone.png',
      tag: 'THEY REPORT BACK',
      title: 'Wake up to the numbers.',
      body: 'Luna sends the morning brief — handled, recovered, and what still needs you — before you ask.',
    },
    {
      img: '/hero/03_text_voice_image_iphone.png',
      tag: 'TEXT · VOICE · PHOTO',
      title: 'However you say it.',
      body: 'A voice note, a transfer screenshot, or a quick line — they read it, classify it, and log it clean.',
    },
    {
      img: '/hero/04_team_chats_iphone.png',
      tag: 'YOUR WHOLE CREW',
      title: 'One chat list. The whole team.',
      body: 'Ivy, Luna and Nova sit in your chats like everyone else. Message the one you need.',
    },
  ],
};

/** COPY.md HOMEPAGE › "Integrations" (section 6 — frontal phone + logo strip). */
export const INTEGRATIONS = {
  eyebrow: 'WORKS WITH YOUR STACK',
  headline: 'Krew works where your business already lives.',
  body: "Your agents don't live in a silo. They work inside the tools your business already runs on — Shopify, Instagram, Telegram, Bosta and Meta — so they see real orders, messages, and deliveries, and act at the right moment. No new dashboard to learn, no migration. Just your crew, where the work already happens.",
  phone: '/hero/krew-integrations-iphone.png',
  logos: '/hero/krew-integrations-logos.png',
};

/** COPY.md HOMEPAGE › "Crew thesis". `image` is the My Krew MacBook render
 *  (WebP compressed from the gitignored 13MB source). */
export const CREW_THESIS = {
  headline: 'One operation. Shared context.',
  body: 'Luna hears what customers say. Ivy knows what it costs. Nova will know what converts. Not three subscriptions — one crew that talks to each other.',
  image: '/hero/shared-context.webp',
};

/** COPY.md HOMEPAGE › "Closing CTA". Headline/CTA agent names come from the
 *  registry; only the fixed fragments live here. */
export const CLOSING_CTA = {
  /** headline = `Start with ${live}. ${headlineTail}` */
  headlineTail: 'Scale with your Krew.',
  sub: 'Know your real numbers this week.',
};
