# KREW-RELAUNCH.md — Ivy-First Landing Relaunch Plan

> Goal: flip mykrew.co from "Luna the chatbot" to "Krew — the multi-agent crew, Ivy live now, Luna in beta."
> Rule: nothing agent-specific is hardcoded. Everything renders from the agent registry.
> **Workflow: all work on `dev`, NEVER a new branch (CLAUDE.md rule 7). Pull at start, push at end.**

---

## ★ ACTIVE PLAN — Landing v2, asset-led rebuild (started 2026-07-14)

Sessions 1–4 (the registry + de-Luna homepage) are DONE and merged to `dev`. We are now
replacing the remaining coded mocks with **real generated assets**, section by section.
Co-designed with the user + Claude web. One object per section, one dark lighting language.

**Page order, top → bottom (status):**
1. **Hero** — Ivy creature (glass-liquid, glowing eyes). ✅ DONE — `components/landing/Hero.tsx`; **STILL image** `public/hero/ivy-hero.webp`. The video was dropped: its background was a dark-gray render (void ~luma 25, brighter than page-10) so no blend mode could fully hide the box, and H.264 re-encode noise made it worse. Fixed at the asset: baked the background to true black with ffmpeg (`colorlevels` black-point 0.14 on the 4800×3584 `ivy-hero.png` source → 1800px webp, ~104KB), then **`mix-blend-mode: lighten`** drops that black against the dark page so the creature floats with no box. Knobs at top of file: `IMG_WIDTH` (240%), `IMG_X`, `IMG_Y`, `FADE_START/END`. Source PNG gitignored. *(Session 2026-07-14→15 — switched video→baked-black still; box gone, big; size/pos knobs.)*
2. **Notification phone** — "Your financial analyst. In your pocket." ✅ DONE — `PocketSection.tsx` (pinned scroll: phone scales down in place, title rises from behind; runs on mobile; asset `ivy-notification.webp`).
3. **Budgets — "Capital, organized"** — eyebrow `CAPITAL, ORGANIZED`, headline "Every pound has a job." (the receipt concept was dropped for this). Split layout: **copy on the LEFT**, a **diagonal cascade of the real Ivy capital cards** (reused `CapitalCard` verbatim — dashboard colorways) on the **RIGHT** — one card per purpose, all clearly visible (top→bottom: Other/obsidian 7k · Photoshoot/copper 60k · PR Campaign/silver 80k · Ads/obsidian 120k · Manufacturing/teal 300k anchoring the front). Scroll-in fade+rise; hover pulls a card up slightly (real pointers only); no edge fade. Mobile: copy first, cascade below, no hover. ✅ DONE — `components/landing/BudgetsSection.tsx`, mounted after `PocketSection`. *(Session 2026-07-15 — receipt concept → budgets/capital-pools beat, per user.)*
4. **Telegram AGENTS** — "Your agents are employees you talk to." ✅ DONE — `components/landing/TelegramSection.tsx`, mounted after Budgets. Pinned scroll (Sintra mechanic): a phone on the LEFT crossfades through four capability renders while a **scroll stepper** on the RIGHT advances (active step brightens + reveals its body, rest dim to their tag; neutral/white rail — crew-wide brand moment, no single agent accent). Assets `public/hero/0{1..4}_*_iphone.png` (give-orders · luna-reports-back · text/voice/photo · team-chats), pure-#000 bg dropped with **`mix-blend-mode: lighten`** — needs a solid backdrop to blend against, so `.tg` **and** the sticky (its own stacking context) carry `background: var(--bg)`; no per-file processing → swap-by-name safe. Copy in `content/landing-copy.ts` (`TELEGRAM_SECTION`). **Pinned on both desktop and mobile** (phone fixed, scroll advances the feature, pin releases to the rest of the site). Desktop: phone + stepper pulled together and centred as one composition. Mobile: phone on top, one focused feature (tag/title/body) below, swapping on scroll. reduced-motion: no pin — four static blocks. *(Session 2026-07-15 — user generated the 4 phone renders; will swap for better later at same filenames.)*
5. **Crew** — "Not another tool. A crew." Three mascot cards, **now with per-agent command-line hooks** folded in (Ivy — "وين راحت الفلوس؟" / Luna — "handle the DMs" / Nova — "soon"), clickable → agent pages. ⏳ TODO — extend existing `CrewSection.tsx` + `AgentCard`.
6. **Integrations** — "Krew works where your business already lives." ✅ DONE — rebuilt `IntegrationsSection.tsx` (hexagons replaced): copy + a transparent logo strip (`krew-integrations-logos.png` — Meta/Instagram/Shopify/Telegram/Bosta) on the LEFT, a frontal phone render (`krew-integrations-iphone.png`, the Krew Integrations screen) on the RIGHT. Pure-#000 render bg dropped with `mix-blend-mode: lighten` over the section's `var(--bg)` backdrop — the surface-gradient dissolves smoothly (no mask, swap-by-name safe). Copy in `content/landing-copy.ts` (`INTEGRATIONS`). **Moved to sit right after the crew reveal** (was after the beta section), matching this page order. Copy body is a first draft pending user sign-off. *(Session 2026-07-15.)*
7. **Luna beta** — floating-DMs overnight-inbox section. ✅ KEEP — `BetaAgentSection.tsx`, already good.
7b. **Crew thesis** — "One operation. Shared context." ✅ DONE — `CrewThesisSection.tsx` now carries the **My Krew MacBook render** on the LEFT (bleeding off the left edge), copy on the RIGHT — the mirror of §6. Same treatment: pure-#000 bg dropped with `mix-blend-mode: lighten` over the section's `var(--bg)` backdrop + a top/bottom mask dissolve. Asset: source `public/hero/Shared context.png` (12.9MB, 4800×3584) **gitignored**; shipped as `public/hero/shared-context.webp` (2000px, 69KB) per the asset pipeline. Knobs `MAC_SCALE/X/Y/FADE` at top of file. *(Session 2026-07-15.)*
8. **Closing CTA** — above "Start with Ivy. Scale with your Krew." Non-clickable image (nav lives in crew cards + navbar). ⏳ TODO. **NOTE:** the MacBook-showing-My-Krew render originally earmarked here now lives in the crew thesis (7b) — pick a different object for the finale, or reuse deliberately; don't double up. Extends `ClosingCtaSection.tsx`.

**Locked decisions:** character opens / product closes (no dashboard in the hero). Object cast = creature → phone → receipt → chat cards → MacBook (five objects, one dark look). MacBook shows the platform, not one agent, and stays non-clickable. The "candy" command trio is folded into the crew cards, NOT its own section. Generate every asset on a **dark void**; composite all numbers/text as coded overlays so canon numbers stay canon. Marketing is **dark-only, no theme toggle** (toggle only on `/dashboard/*`). Aura background washes are retired (KREW-DESIGN §3 v3) — aura lives only on agent-card textures.

**Asset pipeline:** user drops raw file into `public/hero/`; assistant compresses (video → H.264 CRF25 +faststart + WebP poster; PNG → WebP via ffmpeg libwebp) and gitignores the heavy source.

**Canon numbers (never invent others):** gross 914,000 · returns 224,000 (28%) · net revenue 690,000 · expenses 30,000 · real profit **660,000** · inventory 700,000 vs 1,000,000 target (70%).

---

## PHASE 0 — Decisions (30 min, before any code)

- [ ] **Lock launch states:** Ivy = `live`, Luna = `beta` (early access), Nova = `soon`. Confirm whether Performance Reporting agent (4th dashboard card) appears on marketing site or stays dashboard-only.
- [ ] **Lock the hero narrative:** multi-agent first ("Meet your Krew") with Ivy as the spotlight, NOT an Ivy-only hero. This is the Film 01 spine on a webpage: Noise → Focus → Krew.
- [ ] **Lock Ivy pricing:** per-agent membership? Ivy-only tier? Bundle (Ivy + Luna beta)? Quotas for Ivy (expenses logged / team members / capital pools / Bosta syncs?). **This blocks Phase 4.**
- [ ] **Lock mascot canon:** final SVGs from Mascot Lab exported as components — idle pose + 2–3 expressions each (Luna magenta, Ivy teal, Nova violet). One shared blob component, per-agent params.

---

## PHASE 1 — Architecture: kill the hardcoding (½ day)

- [x] **`lib/agents.ts` registry** — single source of truth:
  ```ts
  {
    slug: 'ivy',
    name: 'Ivy',
    role: 'Financial Visibility',
    status: 'live' | 'beta' | 'soon',
    accent: { base: '#14B8A6', glow: '...' },   // from KREW-DESIGN tokens
    mascot: IvyBlob,                             // SVG component w/ expression prop
    tagline: 'Know your real profit.',
    oneLiner: '...',
    href: '/agents/ivy',
    channels: ['Telegram', 'Bosta', 'Shopify'],
  }
  ```
- [x] **`<AgentMascot />`** — one component, props: `agent`, `size`, `expression`, `animated`. Reuses Mascot Lab SVG system. Idle float + subtle inner-glow breathing by default; respects `prefers-reduced-motion`. *(Only the idle pose is exported so far — expression variants still to come from Mascot Lab.)*
- [x] **`<AgentStatusBadge />`** — LIVE (pulsing dot), BETA (accent outline), SOON (dimmed). Driven by registry.
- [x] **`<AgentCard />`** — the Image-1 style card (dark, radial accent glow, mascot centered, name + /role). Used on landing lineup + dashboard parity.
- [x] **Refactor nav + footer** to map over registry. Delete every hardcoded "Luna" nav string. "How It Works" copy becomes agent-agnostic ("How agents operate inside your business").
- [x] **Per-agent theme scope:** CSS variable scope (`[data-agent="ivy"]`) so any section can inherit an agent's accent without new CSS.

---

## PHASE 2 — Landing page rebuild (2 days)

### 2.1 Hero — Ivy's wedge (DECIDED: live-agent hero, crew is beat #2)
- [x] Headline = Ivy's real-profit hook, same big-type style as current hero. Direction:
  - "Shopify says EGP 914,000. **Your real profit is EGP 660,000.**"
  - or "Your **real** profit. Finally visible."
- [x] Ivy mascot alive in the frame (idle float + glow breathing).
- [x] One quiet crew signal: Luna + Nova mascots small/dimmed at the edge, OR a single sub-line: "Ivy is the first of your Krew." *(shipped the sub-line option)*
- [x] Primary CTA: "Start with Ivy". Secondary: "Meet the crew" → scroll to 2.2.
- [x] **Structural rule:** hero content comes from the registry's `live` agent — when Nova launches, the hero rotates by flipping registry state, not by rewriting the page. *(hero copy lives in content/agent-content.ts, keyed by slug)*

### 2.2 The Crew reveal — "Not another tool. A crew."
- [x] Immediately after the hero. Three mascots assemble into formation (Film 01 beat, simplified) → settle into the three `<AgentCard />`s (Image-1 layout). *(cards assemble from a center stack; mascots ride inside)*
- [x] Hover: mascot expression change + glow bloom. Ivy = LIVE → /agents/ivy. Luna = BETA → /agents/luna. Nova = SOON (dimmed, teaser). *(glow bloom + links/statuses done; expression swap still blocked on Mascot Lab expression exports)*
- [x] This section is permanent brand layer; hero above it rotates with launch focus.

### 2.3 Ivy Spotlight (the new "main character" section)
> **REMOVED from the homepage 2026-07-15** (per user): `SpotlightSection` (the wedge + return dial + Telegram recap) is unmounted from `app/page.tsx` — its job is now carried by the Budgets (§3) and Telegram (§4) sections. The component file is kept (parked), not deleted.

- [x] **The wedge, stated plainly:** "Shopify says EGP 914,000. Your real number is EGP 660,000." Gross → returns → expenses → real net profit, animated as a collapsing number. *(centerpiece: one figure that collapses 914,000 → 690,000 → 660,000 as the two deductions reveal on scroll; label morphs to accent "Your real net profit")*
- [x] **Telegram demo block** — reframed: the full voice/receipt/chips money-shot shipped in the **hero stage** (Session 2). The spotlight carries the short **multi-user** beat only — staff message + role badge "STAFF" → "Logged ✓ Delivery fuel — EGP 500 · by Omar" — per the COPY.md Session-3 note (wedge is the centerpiece here, Telegram is a recap).
  - [x] Simulated Telegram thread: voice note → transcribed → "Logged ✓ Packaging" *(hero stage)*
  - [x] Receipt photo → parsed → categorized *(hero stage)*
  - [x] Team member logging with role badge (multi-user) *(spotlight recap)*
  - [x] Scroll-triggered reveals; reduced-motion falls back to the resolved state.
- [x] **COD returns card:** the 28% return-rate dial, with the line "EGP 224,000 came back as COD returns Shopify can't see." *(SVG ring animates to 28% on scroll, stands beside the wedge as proof for the biggest deduction)*
- [x] Mini dashboard peek + CTA. *(shipped as a clean closing beat — the approved line + "Start with Ivy" CTA; the full rebuilt dashboard mock lives in the hero, not duplicated here, per the flow decision 2026-07-11)*

### 2.4 Luna section — reframed as beta
- [x] Compress the current Luna content into ONE tight section rendered from the registry's **beta agent** (`getBetaAgent()`): eyebrow `{name} — {role}` + BETA badge, the multilingual overnight-inbox wall kept as the visual (reframed `ReliefSection` → `BetaAgentSection`), approved headline/sub. Features reel + 4-step how-it-works cut from the homepage and **parked** as unmounted components (`FeaturesSection`, `HowItWorksSection`) for /agents/luna in Session 5.
- [x] CTA: "Request invite" (per LOCKED decision #3 — invite-only, not "Join beta").

### 2.5 The Crew thesis section
- [x] Short manifesto beat: "One operation. Shared context." + the crew body — `CrewThesisSection`, copy from `content/landing-copy.ts`.

### 2.6 Cleanup
- [x] Early-access CTA copy: "Start with Ivy. Scale with your Krew." — `ClosingCtaSection`, agent names interpolated from the registry (rotates).
- [x] Footer blurb: kill "Starting with customer service." → "AI agents that run your brand's operations." *(done early, in Session 1's footer extraction)*
- [x] Footer agent links from registry. *(done early, in Session 1's footer extraction)*

---

## PHASE 3 — Agent pages (1–1.5 days)

- [ ] **Agent page template** driven by registry + per-agent content config (hero, capability blocks, demo component, metrics, CTA). One layout, per-agent theming.
- [ ] **/agents/ivy — NEW (priority):**
  1. Hero: Ivy mascot + "Your real profit. Finally visible."
  2. The COD/Bosta wedge explained (Shopify number vs real number)
  3. Telegram agent: voice / photo / text logging, team roles, deep-link auth
  4. Capital pools + expense categories
  5. Dashboard tour (6 pages)
  6. Pricing/CTA
- [ ] **/agents/luna — reframe:** move homepage's 4-step how-it-works + full features reel here. Add BETA framing + mascot. Content mostly exists — restructure, don't rewrite.
- [ ] **/agents/nova — teaser page or modal:** mascot, one paragraph, "Get notified."

---

## PHASE 4 — Pricing (½–1 day, blocked by Phase 0 decision)

- [ ] Remove "luna membership" labels.
- [ ] Agent tab/toggle on pricing page (Ivy | Luna beta) rendered from registry.
- [ ] Ivy tiers with Ivy-relevant quotas; Luna beta = invite/free-during-beta framing if that's the play.
- [ ] Update the estimator (conversations slider is Luna-only — either scope it to the Luna tab or add an Ivy equivalent).

---

## PHASE 5 — Meta, SEO, and brand surface (½ day)

- [ ] Title/meta: kill "AI-powered customer service automation platform" → multi-agent positioning ("AI agents for MENA e-commerce operations" direction).
- [ ] Per-page titles + descriptions (home, /agents/ivy, /agents/luna, pricing).
- [ ] **OG images with mascots** — generate per-agent OG cards from the Image-1 card design. This is what gets shared in WhatsApp/Telegram groups; it must show the new identity.
- [ ] Favicon/app icon check against new identity.

---

## PHASE 6 — Motion & craft pass (1 day)

- [ ] Mascot idle animation (float + glow breathing) everywhere mascots appear.
- [ ] Scroll-triggered reveals for Ivy spotlight (Telegram sequence plays as you scroll).
- [ ] Hero assemble animation polish.
- [ ] Page-load stagger, hover states, LIVE badge pulse.
- [ ] `prefers-reduced-motion` fallbacks for all of it.
- [ ] Anti-drift check against KREW-DESIGN tokens (#0A0A0A base, #161618 surfaces, one accent per agent, no gradient soup).

---

## PHASE 7 — QA & ship (½ day)

- [ ] Mobile pass — hero assemble + Telegram demo must degrade gracefully on small screens.
- [ ] Copy pass: search codebase for hardcoded "Luna" strings; every hit must come from registry or agent config.
- [ ] Lighthouse (mascot SVGs + glows can tank paint times — check).
- [ ] Dead links: Ivy nav item currently links nowhere.
- [ ] Cross-check site claims vs actual product (dashboard pages, Telegram features) — no vaporware copy.

---

## Suggested sequence (fastest to "ready")

| Day | Work |
|-----|------|
| 1 AM | Phase 0 decisions + registry + mascot component |
| 1 PM | Nav/footer refactor + AgentCard + lineup section |
| 2 | New hero + Ivy spotlight (Telegram demo) |
| 3 AM | Luna compression + crew thesis + cleanup |
| 3 PM | /agents/ivy page |
| 4 | /agents/luna reframe + pricing + meta/OG |
| 5 | Motion pass + QA + ship |

## Decisions — LOCKED (2026-07-09)
1. **Ivy pricing:** per-agent tiers. (Quotas still TBD — define before Session 6.)
2. **Nova on landing:** named, SOON card (dimmed treatment per KREW-DESIGN §6).
3. **Luna beta:** invite-only. Badge reads "BETA — INVITE ONLY"; CTA = request invite, not signup.
4. **Mascots:** product-level + branding surfaces, always animated (idle float/glow/blink per KREW-DESIGN §4). They do NOT replace the logomark or enter the navbar.
5. **Arabic landing:** later — out of this sprint. Don't structure against it, but no RTL work now.

---

# OPERATION PROTOCOL — how Claude Code executes this without creating mess

## Hard rules (paste into CLAUDE.md in repo root)
1. **Read before write.** Every phase starts read-only: inventory the files involved, output a plan listing exactly which files will be created/modified, wait for approval. No code before the plan is approved.
2. **Registry is law.** All agent data (name, role, status, color, tagline, route, mascot) lives ONLY in `lib/agents.ts` + per-agent content configs. Acceptance test for every phase: `grep -ri "luna\|ivy\|nova" app/ components/` returns zero marketing-copy hits outside registry/content/copy files.
3. **No invented copy.** All user-facing strings come from `content/COPY.md`. If a string is missing, STOP and ask — do not draft placeholder marketing copy.
4. **No invented colors.** Only tokens from KREW-DESIGN.md. No new hex values, no new gradients.
5. **No new dependencies** without asking first. Prefer what's already in the repo (framer-motion if present, CSS otherwise).
6. **Reuse the shell.** Study existing layout/section components before creating new ones. New components only when nothing existing fits.
7. **One phase = one branch = one PR** into dev. Small commits, each one leaves the site buildable (`npm run build` passes).
8. **Don't touch pages outside the current phase's scope.** Phase 1 does not edit the homepage. Phase 2 does not edit pricing.

## Files to have IN THE REPO before session 1
| File | Contents | Status |
|------|----------|--------|
| `KREW-RELAUNCH.md` | this plan | drop in root |
| `CLAUDE.md` | hard rules above + stack notes | create |
| `KREW-DESIGN.md` | tokens, anti-drift checklist | exists — verify current |
| `content/COPY.md` | ALL approved strings: hero, cards, Ivy spotlight, Telegram demo script, CTAs, meta/SEO, footer | write with Claude chat first |
| `public/mascots/` | exported SVGs from Mascot Lab | export (see below) |
| `design-refs/` | agent-cards.png (the 3-card mascot image), ivy-dashboard-overview.png, ivy-revenue.png, current-homepage.png | drop in |

## Mascot export spec (from Mascot Lab)
- Per agent, per expression: `luna-idle.svg`, `luna-happy.svg`, `ivy-idle.svg`, `ivy-focus.svg`, `nova-idle.svg`, … (kebab-case, one blob per file)
- SVGs must use `currentColor`/CSS variables for inner glow where possible so `<AgentMascot />` can theme them — if baked colors are unavoidable, note the fills so Phase 1 parameterizes them
- ViewBox normalized (same canvas size across all) so swapping expressions doesn't jump
- Face elements (eyes/mouth) as separate groups with ids (`#eyes`, `#mouth`) → enables blink/expression animation without new files

## Session plan (one Claude Code session per row)

> **⚠ Branch workflow changed 2026-07-13 (CLAUDE.md rule 7):** ALL work now happens
> directly on `dev` — no new branches, ever. The Branch column below is historical;
> sessions 1–4 + the Ivy dashboard build were merged into `dev` on 2026-07-13.
> Sessions 5–7 run on `dev`.

| Session | Branch | Scope | Definition of done |
|---------|--------|-------|--------------------|
| 1 | `feat/agent-registry` | Phase 0 audit + Phase 1 (registry, AgentMascot, AgentStatusBadge, AgentCard, nav+footer refactor) | grep test passes; nav/footer render from registry; test page at /dev/agents showing all cards+badges+mascots |
| 2 | `feat/landing-hero-crew` | 2.1 + 2.2 | Hero pulls live agent from registry; crew section assembled; mobile OK |
| 3 | `feat/ivy-spotlight` | 2.3 Telegram demo + wedge | Scroll sequence works; reduced-motion fallback · **Session 3 — done, 2026-07-11, feat/ivy-spotlight** |
| 4 | `feat/landing-luna-cleanup` | 2.4–2.6 | Homepage fully de-Luna'd · **Session 4 — done, 2026-07-11, feat/landing-luna-cleanup** (app/page.tsx Luna-clean; FeaturesSection + HowItWorksSection parked for Session 5) |
| 5 | `feat/agent-pages` | Phase 3 | /agents/ivy live, /agents/luna reframed |
| 6 | `feat/pricing-meta` | Phase 4 + 5 | Pricing per-agent; meta/OG updated |
| 7 | `feat/motion-qa` | Phase 6 + 7 | Lighthouse pass, mobile pass, ship to main |

## Out-of-band builds (product dashboard — outside the landing relaunch)
| Build | Branch | Scope | Status |
|-------|--------|-------|--------|
| Ivy launch readiness | `feat/ivy-launch-readiness` | First-open onboarding flow · product-level inventory rebuild (costs/alerts/bulk-fill) · two-layer profit (real profit vs cash) · alert preferences. Frontend-only against mocked API contracts; no marketing/registry/other-agent changes. | **done, 2026-07-12, feat/ivy-launch-readiness** |

## Kickoff prompt template (Session 1 — adapt per session)
```
Read, in this order, before doing anything:
1. CLAUDE.md (hard rules — these override everything)
2. KREW-RELAUNCH.md (we are executing Session 1: Phase 0 audit + Phase 1)
3. KREW-DESIGN.md
4. content/COPY.md
5. The existing nav, footer, and homepage components — map how agent
   info currently flows through them.

Then, WITHOUT writing any code:
- Output an inventory of every hardcoded agent reference (file + line)
- Output the exact list of files you will create/modify for Phase 1
- Output the proposed agents.ts schema

Wait for my approval before implementing.
Scope: Phase 1 only. Do not touch page copy, hero, pricing, or routes.
```

