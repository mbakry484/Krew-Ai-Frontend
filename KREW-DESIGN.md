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

## 3. The Aura (signature background treatment)

Reference: `design-refs/aura-luna.png`, `aura-ivy.png`, `aura-nova.png`. Every agent-themed section/card background follows this recipe:

1. **Base:** `--bg-base` black.
2. **Primary glow:** large radial gradient of `aura-core`, positioned **off-center upper-left** (~30% x, 35% y), soft falloff to transparent by ~70% radius.
3. **Secondary bleed:** smaller, dimmer radial of `aura-bleed` in the **lower-right corner**, barely visible — it's felt, not seen.
4. **Vignette:** edges fall to pure black.
5. **Noise:** film grain over everything, **strong** — visible texture, not a whisper. SVG `feTurbulence` (fractalNoise, baseFrequency ~0.9, opacity 0.10–0.14) or a tiling noise PNG at similar opacity, `mix-blend-mode: overlay`.

```css
[data-agent] .aura {
  background:
    radial-gradient(ellipse 80% 70% at 30% 35%, var(--aura-core-a35), transparent 70%),
    radial-gradient(ellipse 50% 45% at 85% 90%, var(--aura-bleed-a20), transparent 70%),
    var(--bg-base);
}
/* + noise layer as ::after with the grain texture */
```

Rules: never a flat linear gradient, never full-saturation edge-to-edge color, noise is mandatory on every aura.

Light theme (decided Session 2): the full aura recipe is dark-only. In light theme an agent-themed section shows only a soft `accent-soft` radial behind the mascot/subject — no dark slab, no new colors.

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
