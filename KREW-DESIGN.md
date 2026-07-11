# KREW-DESIGN.md — Design System & Anti-Drift Rules

The single source of truth for colors, surfaces, auras, mascots, and motion.
If a value isn't in this file, it doesn't go in the code. No invented hex, no invented gradients.

---

## 1. Foundations

| Token | Value | Use |
|-------|-------|-----|
| `--bg-base` | `#0A0A0A` | Page background. Everything sits on this. |
| `--bg-surface` | `#161618` | Elevated cards, nav, modals |
| `--bg-surface-2` | `#1E1E21` | Hover state of surfaces, nested cards |
| `--border-subtle` | `rgba(255,255,255,0.07)` | Card borders, dividers |
| `--border-strong` | `rgba(255,255,255,0.14)` | Focused/active borders |
| `--text-primary` | `rgba(255,255,255,0.95)` | Headlines |
| `--text-secondary` | `rgba(255,255,255,0.65)` | Body copy |
| `--text-tertiary` | `rgba(255,255,255,0.40)` | Captions, labels, eyebrows |

Typography: keep the site's existing sans. Headlines large and light-weight (300–400), tight leading, generous letter-space on small caps eyebrows (`KREW — CUSTOMER OPERATIONS` style). No new fonts.

---

## 2. Agent accents

One accent per agent. Never mix two agent accents in one component.

| Agent | `accent` | `accent-soft` (15% alpha fills) | `aura-core` | `aura-bleed` (secondary corner hue) |
|-------|----------|--------------------------------|-------------|-------------------------------------|
| **Luna** | `#FF3D9E` | `rgba(255,61,158,0.15)` | `#E86FAE` | `#C2402A` (warm ember, lower-right) |
| **Ivy** | `#1FCFA4` | `rgba(31,207,164,0.15)` | `#5FCDB2` | `#1E5F8A` (deep blue, lower-right) |
| **Nova** | `#7C5CFF` | `rgba(124,92,255,0.15)` | `#7FA3D9` | `#3B2FBF` (indigo, lower-right) |

Neutral/brand (non-agent) accent: white on dark. Krew brand moments use no color accent — color belongs to agents.

---

## 3. The Aura (signature background treatment) — v2, grain-first

Reference: `design-refs/aura-luna.png`, `aura-ivy.png`, `aura-nova.png` — these ARE the target. The look is xAI-card-like: **near-black, muted color, grain doing the texture work.** If a surface reads as a smooth colorful gradient, it is wrong.

**Hard limits:**
- Color must never dominate. At least ~60% of any aura surface stays near-black. Glow peak luminosity stays low — the accent is *felt* in the dark, never a bright pool.
- Grain must be **visible at a glance** at normal viewing distance. If you can't see grain in a screenshot, it fails. feTurbulence baseFrequency ~0.65–0.8, grain scale large enough to read (not sub-pixel dust), opacity 0.12–0.18, `mix-blend-mode: overlay` on dark.
- No smooth edge-to-edge saturation, ever.

**Two sanctioned implementations:**

**(a) Texture asset (preferred for agent cards):** use the aura PNGs themselves, compressed to WebP (~1200px, quality ~70), as the card background layer (`background-size: cover`), content on top. This guarantees the exact designed look with zero generative drift. One asset per agent: `public/textures/aura-{slug}.webp`.

**(b) CSS recipe (for large/section surfaces where an image won't scale):**
1. Base `--bg-base` black.
2. Primary glow: radial of `aura-core` **at reduced alpha (≤0.22 peak)**, off-center upper-left, tight falloff (transparent by ~55% radius).
3. Secondary bleed: `aura-bleed` lower-right, ≤0.10 alpha — subliminal.
4. Vignette to pure black edges.
5. Grain layer per the hard limits above. Mandatory.

**Hero rule (marketing pages):** the hero background is *predominantly clean near-black*. Accent tint concentrates behind/around the product stage (the demo devices) and fades out before it reaches the headline column — the type sits on clean dark, like the pre-relaunch site. No page-wide color wash.

---

## 4. Mascots

- Translucent glass blob per agent; inner glow in the agent accent; minimal face (eyes/mouth groups: `#eyes`, `#mouth`).
- Source SVGs: `public/mascots/`. One shared `<AgentMascot />` component, themed via registry.
- **Mascots are never static.** Minimum idle behavior wherever they appear (product + branding surfaces):
  - Float: slow vertical drift, ±6px, ~6s ease-in-out loop
  - Glow breathing: inner-glow opacity 0.85 → 1.0, ~4s loop, offset from float
  - Blink: eyes scaleY dip every 4–7s (randomized)
- Expression swaps on interaction (hover/success states) via `#eyes`/`#mouth` groups, not file swaps where possible.
- `prefers-reduced-motion`: freeze float/blink, keep static glow.
- Mascots live at **product level and brand/marketing surfaces**. They do NOT replace the Krew logomark or enter the navbar.

---

## 5. Motion principles

- Slow and heavy, not springy: default `cubic-bezier(0.22, 1, 0.36, 1)`, durations 600–900ms for section reveals, 200–300ms for micro-interactions.
- Scroll reveals: opacity + ≤24px translate. No zoom-ins, no rotations, no bounce.
- One hero-grade animated moment per page maximum. Everything else stays quiet.
- Everything respects `prefers-reduced-motion`.

---

## 6. Status system

| Status | Treatment |
|--------|-----------|
| `live` | Accent dot, slow pulse, label "LIVE" |
| `beta` | Accent outline chip, label "BETA — INVITE ONLY" |
| `soon` | Dimmed (40% opacity content), grayscale mascot glow, label "SOON" |

---

## 7. Anti-drift checklist (run before every PR)

- [ ] No hex value in the diff that isn't in this file
- [ ] No agent name/color hardcoded outside `lib/agents.ts` / content configs
- [ ] Every aura has noise; no flat gradients snuck in
- [ ] No two agent accents in one component
- [ ] Mascots animate (or reduced-motion fallback present)
- [ ] Copy strings all trace to `content/COPY.md`
- [ ] Dark base is `#0A0A0A`, not `#000` or `#111`
