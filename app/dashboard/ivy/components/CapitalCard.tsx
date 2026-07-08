'use client';

import { CARD_THEME } from './cardThemes';
import { formatEGP } from '@/components/DashboardPrimitives';
import { CapitalColor } from '@/lib/ivy/types';

// The metallic Visa-style capital card face. Extracted from the Capital page
// so the same card renders everywhere a pool shows up: the Capital grid, the
// pool modal live preview, and the overview hero echo (size="sm"). Styling
// lives under `.cap-card` in globals.css.

/** Stable pseudo card number from the pool id — pure visa flavour. */
export function cardDigits(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return String(h % 10000).padStart(4, '0');
}

function KrewMark() {
  return (
    <svg viewBox="665 1125 735 145" className="h-[11px] w-auto" fill="currentColor" aria-label="Krew">
      <g transform="translate(0,2350) scale(0.1,-0.1)">
        <path d="M8005 11988 c-99 -106 -384 -399 -634 -650 l-454 -458 344 0 344 0 200 200 c110 110 207 200 216 200 9 0 23 -8 32 -18 15 -16 17 -45 17 -200 l0 -182 404 0 404 0 242 243 242 242 -183 3 c-114 1 -187 7 -196 13 -37 32 -20 53 352 424 201 201 365 367 365 370 0 3 -152 5 -338 5 l-338 0 -195 -193 c-107 -107 -201 -196 -210 -200 -22 -7 -59 19 -59 42 0 10 72 90 160 178 88 88 160 163 160 167 0 3 -156 6 -347 6 l-348 0 -180 -192z"/>
        <path d="M9882 12148 c-9 -9 -12 -161 -12 -625 0 -595 1 -613 19 -623 28 -15 104 -12 127 4 18 14 19 26 16 204 -3 164 -1 195 13 224 23 44 168 178 194 178 14 0 76 -79 235 -304 119 -167 223 -307 232 -310 24 -9 147 -7 163 3 22 14 9 37 -145 248 -265 363 -342 472 -348 491 -5 15 42 67 235 255 135 132 239 242 237 249 -3 9 -31 14 -93 16 l-88 3 -296 -296 c-163 -162 -304 -295 -313 -295 -26 0 -30 41 -27 306 2 197 0 256 -10 268 -16 19 -121 22 -139 4z"/>
        <path d="M11285 11816 c-65 -21 -97 -41 -151 -96 -29 -29 -57 -49 -63 -46 -6 4 -11 29 -11 56 0 60 -18 80 -70 80 -73 0 -70 19 -70 -464 0 -323 3 -435 12 -444 16 -16 113 -15 126 1 8 9 12 95 12 249 1 250 10 318 48 380 49 79 112 120 205 133 62 9 77 26 77 81 0 83 -25 98 -115 70z"/>
        <path d="M11730 11816 c-181 -32 -311 -171 -347 -371 -24 -140 6 -298 80 -406 81 -121 203 -174 380 -167 86 3 110 8 153 31 91 46 151 112 180 196 18 52 11 68 -35 76 -56 9 -84 -7 -119 -68 -42 -75 -105 -107 -206 -107 -39 1 -88 7 -109 14 -84 31 -149 108 -166 200 -8 41 -6 51 10 67 18 18 38 19 328 19 263 0 310 2 321 15 17 21 8 132 -19 216 -67 212 -241 322 -451 285z m176 -154 c49 -25 100 -80 125 -136 23 -50 23 -60 3 -80 -13 -14 -49 -16 -243 -16 -254 0 -259 1 -247 63 14 75 85 154 165 184 49 18 146 11 197 -15z"/>
        <path d="M12233 11803 c-28 -11 -18 -48 157 -588 32 -99 66 -206 75 -237 22 -79 34 -88 108 -88 34 0 67 4 73 8 16 10 24 40 105 362 65 263 82 311 101 292 4 -4 43 -148 87 -320 44 -172 85 -320 91 -328 19 -22 132 -19 152 4 9 9 50 125 91 257 42 132 101 319 132 415 59 187 61 200 43 218 -18 18 -93 15 -116 -5 -16 -14 -43 -98 -106 -331 -47 -172 -91 -323 -97 -334 -11 -21 -12 -21 -25 -4 -7 10 -20 48 -28 85 -13 56 -104 412 -137 533 -5 20 -16 44 -25 53 -22 22 -116 20 -142 -2 -16 -14 -37 -86 -91 -306 -39 -158 -71 -292 -71 -298 0 -5 -7 -26 -15 -46 -13 -32 -17 -35 -29 -22 -8 8 -30 75 -51 149 -20 74 -45 164 -55 200 -10 36 -33 119 -50 185 -37 139 -50 155 -119 154 -25 0 -52 -3 -58 -6z"/>
        <path d="M13656 11755 c-41 -22 -55 -44 -56 -90 0 -75 62 -124 134 -104 40 11 76 57 76 97 0 36 -27 80 -60 97 -37 19 -57 19 -94 0z"/>
        <path d="M13665 11705 c-29 -28 -31 -51 -9 -83 20 -29 79 -31 94 -2 12 23 -2 27 -20 5 -18 -21 -37 -19 -54 8 -31 46 14 98 54 62 11 -10 20 -12 24 -6 7 11 -31 41 -52 41 -7 0 -24 -11 -37 -25z"/>
      </g>
    </svg>
  );
}

export default function CapitalCard({
  name,
  injected,
  balance,
  color,
  digits,
  onClick,
  expanded,
  size = 'md',
}: {
  name: string;
  injected: number;
  balance: number;
  color: CapitalColor;
  digits: string;
  onClick?: () => void;
  expanded?: boolean;
  /** "sm" is the compact echo used on the overview hero. */
  size?: 'md' | 'sm';
}) {
  const theme = CARD_THEME[color];
  const spent = injected - balance;
  const spentPct = injected > 0 ? Math.max(0, Math.min(100, (spent / injected) * 100)) : 0;

  return (
    <div
      className="cap-card"
      data-dark={theme.darkText ? 'true' : 'false'}
      data-interactive={onClick ? 'true' : 'false'}
      data-size={size}
      style={{ ['--card-bg' as string]: theme.gradient }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      aria-expanded={onClick ? expanded : undefined}
    >
      <div className="cap-card-sheen" />
      <div className="cap-card-inner">
        <div className="flex items-start justify-between">
          <KrewMark />
          <span className="cap-card-badge">{theme.label}</span>
        </div>

        <div>
          <div className="cap-card-name">{name || 'Untitled pool'}</div>
          <div className="cap-card-digits">•••• •••• •••• {digits}</div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="cap-card-balance">{formatEGP(balance)}</div>
            <div className="cap-card-sub">remaining of {formatEGP(injected)}</div>
          </div>
          <div className="cap-card-spend">
            <span className="cap-card-spend-num">{Math.round(spentPct)}%</span>
            <span className="cap-card-spend-lbl">spent</span>
          </div>
        </div>
      </div>
      <div className="cap-card-bar"><span style={{ width: `${spentPct}%` }} /></div>
    </div>
  );
}
