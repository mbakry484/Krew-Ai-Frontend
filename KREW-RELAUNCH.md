# KREW-RELAUNCH.md — Ivy-First Landing Relaunch Plan

> Goal: flip mykrew.co from "Luna the chatbot" to "Krew — the multi-agent crew, Ivy live now, Luna in beta."
> Rule: nothing agent-specific is hardcoded. Everything renders from the agent registry.

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
- [x] **The wedge, stated plainly:** "Shopify says EGP 914,000. Your real number is EGP 660,000." Gross → returns → expenses → real net profit, animated as a collapsing number. *(centerpiece: one figure that collapses 914,000 → 690,000 → 660,000 as the two deductions reveal on scroll; label morphs to accent "Your real net profit")*
- [x] **Telegram demo block** — reframed: the full voice/receipt/chips money-shot shipped in the **hero stage** (Session 2). The spotlight carries the short **multi-user** beat only — staff message + role badge "STAFF" → "Logged ✓ Delivery fuel — EGP 500 · by Omar" — per the COPY.md Session-3 note (wedge is the centerpiece here, Telegram is a recap).
  - [x] Simulated Telegram thread: voice note → transcribed → "Logged ✓ Packaging" *(hero stage)*
  - [x] Receipt photo → parsed → categorized *(hero stage)*
  - [x] Team member logging with role badge (multi-user) *(spotlight recap)*
  - [x] Scroll-triggered reveals; reduced-motion falls back to the resolved state.
- [x] **COD returns card:** the 28% return-rate dial, with the line "EGP 224,000 came back as COD returns Shopify can't see." *(SVG ring animates to 28% on scroll, stands beside the wedge as proof for the biggest deduction)*
- [x] Mini dashboard peek + CTA. *(shipped as a clean closing beat — the approved line + "Start with Ivy" CTA; the full rebuilt dashboard mock lives in the hero, not duplicated here, per the flow decision 2026-07-11)*

### 2.4 Luna section — reframed as beta
- [ ] Compress the current Luna content (features reel + overnight inbox) into ONE tight section: "Luna — Customer Operations. In beta." Keep the best asset (the multilingual overnight inbox wall — it's strong), cut the 4-step how-it-works from the homepage (move to /agents/luna).
- [ ] CTA: "Join Luna beta."

### 2.5 The Crew thesis section
- [ ] Short manifesto beat: agents share context, one operation. "Luna hears what customers say. Ivy knows what it costs. Nova will know what converts." Ties to Our Vision page.

### 2.6 Cleanup
- [ ] Early-access CTA copy: "Start with Ivy. Scale with your Krew."
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
| Session | Branch | Scope | Definition of done |
|---------|--------|-------|--------------------|
| 1 | `feat/agent-registry` | Phase 0 audit + Phase 1 (registry, AgentMascot, AgentStatusBadge, AgentCard, nav+footer refactor) | grep test passes; nav/footer render from registry; test page at /dev/agents showing all cards+badges+mascots |
| 2 | `feat/landing-hero-crew` | 2.1 + 2.2 | Hero pulls live agent from registry; crew section assembled; mobile OK |
| 3 | `feat/ivy-spotlight` | 2.3 Telegram demo + wedge | Scroll sequence works; reduced-motion fallback · **Session 3 — done, 2026-07-11, feat/ivy-spotlight** |
| 4 | `feat/landing-luna-cleanup` | 2.4–2.6 | Homepage fully de-Luna'd |
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

