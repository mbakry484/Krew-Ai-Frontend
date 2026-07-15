// =============================================================================
// ABOUT / VISION COPY — the four-film section (COPY.md "ABOUT / VISION").
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

/** COPY.md ABOUT / VISION › "The four films". Order is the arc:
 *  sleep → health → people → craft (work is the closer). */
export const VISION_FILMS: { headline: string; films: VisionFilm[] } = {
  headline: 'This is what running a brand should look like.',
  films: [
    {
      id: 'sleep',
      video: '/vision/sleep.mp4',
      poster: '/vision/sleep-poster.webp',
      line: 'He stopped sleeping with one eye on the inbox.',
      chipAgent: 'luna',
      chipText: 'Replied — order confirmed · 2:47 AM',
    },
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
      id: 'work',
      video: '/vision/work.mp4',
      poster: '/vision/work-poster.webp',
      line: 'Back to the work only you can do.',
      chipAgent: 'ivy',
      chipText: 'Courier settlement logged ✓',
    },
  ],
};
