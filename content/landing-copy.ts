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

/** COPY.md HOMEPAGE › "Crew thesis". */
export const CREW_THESIS = {
  headline: 'One operation. Shared context.',
  body: 'Luna hears what customers say. Ivy knows what it costs. Nova will know what converts. Not three subscriptions — one crew that talks to each other.',
};

/** COPY.md HOMEPAGE › "Closing CTA". Headline/CTA agent names come from the
 *  registry; only the fixed fragments live here. */
export const CLOSING_CTA = {
  /** headline = `Start with ${live}. ${headlineTail}` */
  headlineTail: 'Scale with your Krew.',
  sub: 'Know your real numbers this week.',
};
