// =============================================================================
// ABOUT / VISION COPY — the films-first hero (COPY.md "ABOUT / VISION").
// Like content/landing-copy.ts this is a sanctioned home for copy: the chips
// name Luna and Ivy by design, so the strings live here rather than being
// hardcoded in a component. Chip identity (mascot, accent) is resolved from
// the registry via `chipAgent` — never restated here.
//
// Every string is verbatim from content/COPY.md. The yoga chip's figures are
// the canon numbers (net EGP 690,000 · EGP 310,000 to go) from the hero script.
// =============================================================================

import type { AgentSlug } from '@/lib/agents';

export interface VisionFilm {
  /** Asset basename: /vision/{id}.mp4 + /vision/{id}-poster.webp */
  id: 'sleep' | 'yoga' | 'dinner' | 'work';
  video: string;
  poster: string;
  /** The editorial center line — fades in after the film breathes. */
  line: string;
  /** Which agent's notification chip appears (mascot + accent from registry). */
  chipAgent: AgentSlug;
  /** The chip's single string — the proof beside the poetry. */
  chipText: string;
}

/** COPY.md ABOUT / VISION › "Films hero" + "The four films". Display order
 *  locked 2026-07-16: yoga → dinner → sleep → work (work stays the closer). */
export const VISION_FILMS: {
  eyebrow: string;
  headline: string;
  body: string;
  films: VisionFilm[];
} = {
  eyebrow: 'Krew — A New Operating Model for Brands',
  headline: 'This is what running a brand should look like.',
  body: 'We believe you should run your brand from the front — the product, the craft, the next move — while a crew of agents carries the rest: every DM answered, every expense logged, your real numbers always true.',
  films: [
    {
      id: 'yoga',
      video: '/vision/yoga.mp4',
      poster: '/vision/yoga-poster.webp',
      line: 'The books balanced themselves this morning.',
      chipAgent: 'ivy',
      chipText: '☀️ Morning brief — EGP 690,000 net · EGP 310,000 to go',
    },
    {
      id: 'dinner',
      video: '/vision/dinner.mp4',
      poster: '/vision/dinner-poster.webp',
      line: 'Nobody checked their phone at lunch.',
      chipAgent: 'luna',
      chipText: '3 orders processed · 12 DMs answered',
    },
    {
      id: 'sleep',
      video: '/vision/sleep.mp4',
      poster: '/vision/sleep-poster.webp',
      line: 'He stopped sleeping with one eye on the inbox.',
      chipAgent: 'luna',
      chipText: 'Replied — order confirmed · 2:47 AM',
    },
    {
      id: 'work',
      video: '/vision/work.mp4',
      poster: '/vision/work-poster.webp',
      line: 'Back to the work only you can do.',
      chipAgent: 'ivy',
      chipText: 'Courier settlement logged ✓',
    },
  ],
};

// =============================================================================
// THE "TODAY" LIST (COPY.md ABOUT / VISION › "The Declaration → Today list").
// The abstract declaration is shown, not stated: one coded iOS "Today" list on
// a photographic iPhone frame. A single day mixes busywork and real work; on
// scroll a line draws through the `handled` tasks (the crew's), leaving the
// rest. Header + screen strings reuse approved copy; the describe paragraph is
// the one new string (locked option A).
// =============================================================================

export interface VisionTask {
  text: string;
  /** true = the crew's busywork — struck through on scroll. */
  handled: boolean;
}

export const VISION_TODO: {
  headline: [string, string];
  body: string;
  screenTitle: string;
  screenSubtitle: string;
  tasks: VisionTask[];
} = {
  headline: ['Founders should build.', 'Agents should operate.'],
  body: "Every line your crew can take, it takes — the replies, the confirmations, the chasing. What's left is the only list that ever mattered: the work that grows the brand, and the life around it.",
  screenTitle: 'Today',
  screenSubtitle: 'Make room for what only you can do.',
  tasks: [
    { text: 'Reply to 83 DMs', handled: true },
    { text: 'Approve the next drop', handled: false },
    { text: 'Confirm COD orders', handled: true },
    { text: 'Review campaign creative', handled: false },
    { text: 'Handle 6 exchanges', handled: true },
    { text: 'Chase courier settlement', handled: true },
    { text: 'Plan the launch story', handled: false },
    { text: 'Sleep before midnight', handled: false },
  ],
};
