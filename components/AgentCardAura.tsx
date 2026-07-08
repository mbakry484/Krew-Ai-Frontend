'use client';

import type { CSSProperties } from 'react';

// Per-agent colorway seed. Stored on the agent/brand config (Supabase JSONB
// `color_identity`) and passed in from the parent that maps over the agents.
export type Colorway = {
  hue: number;    // 0-360
  sat: number;    // 0-100
  angle: number;  // 0-360, corner the glow anchors to
};

/**
 * Full-card aura: a soft color wash that tints the whole card, plus a glowing
 * organic shape (blurred blob + light ring) anchored near the colorway corner,
 * slowly rotating and drifting. Rendered as an absolutely-positioned layer
 * BEHIND the card's content (which must sit in a `position: relative;
 * z-index: 1` layer). Everything visual — status dimming, hover, theme,
 * reduced motion — is resolved by the `.agent-aura` rules in globals.css from
 * the CSS variables set here.
 *
 * Performance: gradients are GPU-composited; only transform/opacity animate.
 */
export default function AgentCardAura({
  colorway,
  status,
}: {
  colorway: Colorway;
  status: 'live' | 'soon';
}) {
  // Anchor the glow inside the card bounds, toward the colorway corner.
  const rad = (colorway.angle * Math.PI) / 180;
  const x = 50 + Math.cos(rad) * 34;
  const y = 50 + Math.sin(rad) * 34;

  // Desync each card's rotation/drift so the grid doesn't move in lockstep.
  const delay = -((colorway.hue % 97) / 10);

  const style = {
    '--aura-hue': `${colorway.hue}`,
    '--aura-sat': `${colorway.sat}%`,
    '--aura-x': `${x.toFixed(1)}%`,
    '--aura-y': `${y.toFixed(1)}%`,
    '--aura-delay': `${delay.toFixed(1)}s`,
  } as CSSProperties;

  return (
    <div className="agent-aura" data-status={status} aria-hidden="true" style={style}>
      <div className="agent-aura-wash" />
      <div className="agent-aura-orb">
        <div className="agent-aura-blob" />
        <div className="agent-aura-ring" />
      </div>
    </div>
  );
}
