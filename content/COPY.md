# COPY.md — Approved Strings (v1)

The ONLY source of user-facing copy. If a string isn't here, Claude Code stops and asks.
Demo numbers are canonical across the whole site: gross **EGP 914,000** · returns **EGP 224,000** (28%) · net revenue **EGP 690,000** · expenses **EGP 30,000** · real net profit **EGP 660,000**. Never invent different numbers.

---

## HOMEPAGE

### Hero (agent = registry `live` → Ivy)
- Eyebrow: `KREW — FINANCIAL VISIBILITY`
- Headline line 1: `Shopify says EGP 914,000.`
- Headline line 2 (emphasis): `Your real profit is EGP 660,000.`
- Sub: `Ivy tracks what Shopify can't see — COD returns, real expenses, actual cash. On Telegram, in Arabic, automatically.`
- Crew signal line: `Ivy is the first of your Krew.`
- CTA primary: `Start with Ivy`
- CTA secondary: `Meet the crew →`

### Ivy pocket beat (homepage — after hero, before the crew)
- Eyebrow: `IVY — FINANCIAL VISIBILITY` *(reused from registry name + role)*
- Headline: `Your financial analyst. In your pocket.`
- Sub: `Ivy watches your cash, returns, and inventory around the clock — and sends the exact move to hit your number.`

### Budgets beat — "Capital, organized" (homepage — after the pocket beat, before the crew)
- Eyebrow: `CAPITAL, ORGANIZED`
- Headline: `Every pound has a job.`
- Body: `Ivy splits your capital across manufacturing, ads, shoots, PR and fulfillment—so nothing disappears into "business expenses."`
- Cards (purpose → allocation, rendered as the real Ivy capital cards): `Manufacturing — EGP 300,000` · `Ads — EGP 120,000` · `PR Campaign — EGP 80,000` · `Photoshoot — EGP 60,000` · `Other — EGP 7,000`

### Telegram beat — "Your agents are employees you talk to" (homepage — after budgets, before the crew; scroll stepper)
- Eyebrow: `YOUR CREW, ON TELEGRAM`
- Headline: `Your agents are employees you talk to.`
- Step 1 — tag `GIVE ORDERS` / title `Just tell them what to do.` / body `Forward a receipt, drop a note — "log this." Ivy files it to the right budget and confirms.`
- Step 2 — tag `THEY REPORT BACK` / title `Wake up to the numbers.` / body `Luna sends the morning brief — handled, recovered, and what still needs you — before you ask.`
- Step 3 — tag `TEXT · VOICE · PHOTO` / title `However you say it.` / body `A voice note, a transfer screenshot, or a quick line — they read it, classify it, and log it clean.`
- Step 4 — tag `YOUR WHOLE CREW` / title `One chat list. The whole team.` / body `Ivy, Luna and Nova sit in your chats like everyone else. Message the one you need.`

### Crew reveal
- Eyebrow: `THE CREW`
- Headline: `Not another tool. A crew.`
- Sub: `Agents that run your brand's operations — each one owns a job, all of them share context.`

#### Agent cards
**Ivy** · status `LIVE`
- Role: `/Financial Visibility`
- Card copy: `Tracks expenses, cash flow, and profitability in real time. Surfaces financial signals so you always know where your money stands.`
- Card CTA: `Open Ivy →`

**Luna** · status `BETA — INVITE ONLY`
- Role: `/Customer Operations`
- Card copy: `Handles Instagram and WhatsApp DMs with your brand voice, processes orders, and escalates complex issues.`
- Card CTA: `Request invite →`

**Nova** · status `SOON`
- Role: `/Marketing Intelligence`
- Card copy: `Connects ad spend, content performance, and conversion data into one clear intelligence layer.`
- Card CTA: `Get notified`

### Ivy spotlight
- Eyebrow: `IVY — FINANCIAL VISIBILITY`
- Headline: `The number Shopify shows you isn't your number.`
- Sub: `Gross revenue minus COD returns minus real expenses. That's the number that decides if you're actually making money.`

#### Wedge sequence (animated collapsing number)
- Step 1 label: `Shopify gross` → `EGP 914,000`
- Step 2 label: `COD returns Shopify can't see` → `− EGP 224,000`
- Step 3 label: `Real expenses` → `− EGP 30,000`
- Result label: `Your real net profit` → `EGP 660,000`

#### Hero stage — Telegram script (plays on the phone mock in the hero; dashboard mock syncs on every "Logged ✓")

**Beat 1 — receipt + pool question**
- Msg 1 (user): [receipt photo attachment]
- Msg 2 (Ivy): `📄 Got it — Shipping supplies, EGP 1,850. Which pool?` + chips: `🟢 Operations` / `🔵 Marketing`
- Msg 3 (user): taps `🟢 Operations`
- Msg 4 (Ivy): `Logged ✓ Shipping supplies — EGP 1,850 · Operations pool` → DASHBOARD TICK

**Beat 2 — voice note**
- Msg 5 (user, voice note bubble, transcript): `دفعت ٣٢٠٠ جنيه تغليف`
- Msg 6 (Ivy): `Logged ✓ Packaging — EGP 3,200 🧾` → DASHBOARD TICK

**Beat 3 — the brain moment**
- Msg 7 (user): `إزاي نوصل مليون جنيه الشهر ده؟`
- Msg 8 (Ivy, one structured message, four lines):
  `📊 You're at EGP 690,000 net — EGP 310,000 to go.`
  `🔻 Returns are 28% (EGP 224,000). Getting to 20% recovers ≈ EGP 73,000.`
  `📦 Top sellers cover 70% of the gap — restock this week.`
  `🎯 Doable. 9 days left.`

Long calm pause, then loop. Reduced motion: static scene showing the final state (all messages visible, dashboard at end values).

#### Spotlight Telegram section (Session 3 — now carries the wedge math as its centerpiece; short Telegram recap only)
- Section headline: `Log expenses the way you already talk.`
- Sub: `Voice note, receipt photo, or a quick text — Ivy logs it, categorizes it, and updates your real profit. You and your team, in Telegram.`
- Team beat (spotlight-only, shows multi-user): (staff member, role badge "STAFF"): `اتدفع ٥٠٠ بنزين للتوصيل` → Ivy: `Logged ✓ Delivery fuel — EGP 500 · by Omar`

#### COD returns card
- Label: `RETURN RATE`
- Stat: `28.0% of gross`
- Line: `EGP 224,000 came back as COD returns Shopify can't see.`

#### Dashboard peek
- Line: `Everything Ivy hears becomes one clear picture.`
- CTA: `Start with Ivy`

### Luna beta section
- Eyebrow: `LUNA — CUSTOMER OPERATIONS · BETA`
- Headline: `Every DM, answered. While you sleep.`
- Sub: `140 conversations a week — orders, returns, questions — handled in Arabic, Franco, and English. Automatically. Currently in invite-only beta.`
- CTA: `Request invite`

### Integrations (homepage — after the crew reveal; frontal phone + logo strip)
- Eyebrow: `WORKS WITH YOUR STACK`
- Headline: `Krew works where your business already lives.`
- Body: `Your agents don't live in a silo. They work inside the tools your business already runs on — Shopify, Instagram, Telegram, Bosta and Meta — so they see real orders, messages, and deliveries, and act at the right moment. No new dashboard to learn, no migration. Just your crew, where the work already happens.`
- Logos strip: Meta · Instagram · Shopify · Telegram · Bosta (`public/hero/krew-integrations-logos.png`)

### Crew thesis
- Headline: `One operation. Shared context.`
- Body: `Luna hears what customers say. Ivy knows what it costs. Nova will know what converts. Not three subscriptions — one crew that talks to each other.`

### Closing CTA
- Headline: `Start with Ivy. Scale with your Krew.`
- Sub: `Know your real numbers this week.`
- CTA primary: `Start with Ivy`
- CTA secondary: `Request Luna invite`

### Footer
- Blurb: `AI agents that run your brand's operations. Built for MENA e-commerce.`
- Agent links: from registry (Ivy, Luna, Nova)

---

## NAV
- Agents (dropdown): `Ivy — Financial Visibility · LIVE` / `Luna — Customer Operations · BETA` / `Nova — Marketing Intelligence · SOON`
- About → How It Works label: `How agents operate inside your business`
- CTA button: `Start with Ivy`

## STATUS BADGES
- `LIVE` / `BETA — INVITE ONLY` / `SOON`

---

## META / SEO
- Home title: `Krew — AI agents for MENA e-commerce operations`
- Home description: `Ivy shows your real profit — COD returns, expenses, and cash Shopify can't see — logged from Telegram. Luna answers every DM. One crew, one operation.`
- /agents/ivy title: `Ivy — Your real profit, finally visible | Krew`
- /agents/ivy description: `Ivy tracks COD returns, expenses, and cash flow automatically. Log expenses by voice note or receipt photo on Telegram. Built for MENA e-commerce.`
- /agents/luna title: `Luna — Every DM answered, while you sleep | Krew`
- /agents/luna description: `Luna handles Instagram and WhatsApp DMs in Arabic, Franco, and English — orders, returns, questions. Invite-only beta.`

---

## AGENT PAGES (v1 — Session 5; refine before that session)

### /agents/ivy
- Hero eyebrow: `IVY — FINANCIAL VISIBILITY`
- Hero headline: `Your real profit. Finally visible.`
- Hero sub: `Shopify shows you gross. Ivy shows you truth — returns, expenses, cash, and the profit you actually keep.`
- Section: The blind spot — headline: `COD returns are eating your margin in the dark.` body: `In MENA e-commerce, a big share of cash-on-delivery orders come back. Shopify still counts them as revenue. Ivy pulls delivery data from Bosta and shows what was actually delivered, what returned, and what it cost you.`
- Section: Telegram — headline: `Your finance team lives in Telegram.` body: `Voice notes, receipt photos, quick texts — from you or your staff, each with their own access. Ivy logs everything into clean categories, instantly.`
- Section: Capital — headline: `Know what's yours to spend.` body: `Capital pools keep inventory money, ad money, and profit separate — so one good month doesn't hide a bad decision.`
- Section: Dashboard — headline: `Six pages. Zero spreadsheets.` body: `Overview, Revenue, Expenses, Capital, Inventory, Activity — every number traceable to where it came from.`
- CTA: `Start with Ivy`

### /agents/luna
- Hero eyebrow: `LUNA — CUSTOMER OPERATIONS · INVITE-ONLY BETA`
- Hero headline: `Every DM, answered. While you sleep.`
- Hero sub: `Luna runs your Instagram and WhatsApp inbox with your brand voice — orders, exchanges, refunds, questions — in Arabic, Franco, and English.`
- Beta note: `Luna is in invite-only beta while we onboard brands one by one.`
- CTA: `Request invite`

### /agents/nova (teaser)
- Headline: `Nova is coming.`
- Body: `Marketing intelligence — ad spend, content, conversions — in one layer. Joining your crew soon.`
- CTA: `Get notified`

---

## ABOUT / VISION (locked 2026-07-15 — film-led rebuild)

### Declaration hero (kept verbatim from the pre-relaunch page)
- Eyebrow: `Krew — A New Operating Model for Brands`
- Headline: `Founders should build.` / `Agents should operate.`
- Sub: `Krew gives every brand an AI-powered operations team — so the people who start companies can go back to building them.`

### The four films (assets `public/vision/{sleep,yoga,dinner,work}.mp4`; arc: sleep → health → people → craft)
- Section headline: `This is what running a brand should look like.`
- Editorial lines fade in after the film breathes; the agent chip staggers in later — never both at once. Chips are coded overlays (mascot + accent from the registry), never baked into footage.

| Film | Editorial line | Chip agent | Chip string |
|------|----------------|------------|-------------|
| sleep | `He stopped sleeping with one eye on the inbox.` | Luna | `Replied — order confirmed · 2:47 AM` |
| yoga | `The books balanced themselves this morning.` | Ivy | `☀️ Morning brief — EGP 690,000 net · EGP 310,000 to go` |
| dinner | `Nobody checked their phone at lunch.` | Luna | `3 orders processed · 12 DMs answered` |
| work | `Back to the work only you can do.` | Ivy | `Courier settlement logged ✓` |

### The Belief tenets (kept verbatim)
- 01: `The best-run brands won't be the ones with the biggest teams. They'll be the ones with the right agents.`
- 02: `Doing everything by hand isn't dedication. It's what's holding your brand back.`
- 03: `You shouldn't need to hire a team to run your store. You should get one from day one.`

### The Krew roster (rows render from the registry — names/roles/status badges only)
- Eyebrow: `The Krew`
- Headline: `One platform.` / `A growing family of agents.`
- *(The old "Luna is the first…" sub is retired — stale since Ivy went live.)*

### The Invitation (kept verbatim)
- Headline: `This is Krew.` / `Come build. We'll handle the rest.`
- CTA: `Join the early access →`

*(Removed in the rebuild until a v3 copy pass: "The Old Way", "That era is ending.", and the stale Mission & Vision block — the films now carry that story.)*
