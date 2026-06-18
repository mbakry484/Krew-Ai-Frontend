# Agent Name Integration — Backend Handoff

This document describes how the **agent display name** (currently hardcoded to
`"Luna"`) is wired on the frontend today, and exactly what the backend needs to
provide later so the name becomes store-configurable.

This was a **frontend-only, display-only** pass. No backend, API, DB, route,
save/submit, or system-prompt code was touched. Everything that needs backend
work is documented below rather than implemented.

---

## 1. Where the frontend reads the agent name

There is now a **single source of truth**:

- **File:** [`components/AgentNameProvider.tsx`](components/AgentNameProvider.tsx)
- **Default constant:** `DEFAULT_AGENT_NAME` (currently `"Luna"`)
- **React context:** `AgentNameContext`
- **Read hook:** `useAgentName()` → returns the current name string
- **Provider:** `<AgentNameProvider name={...}>`, mounted once in
  [`app/layout.tsx`](app/layout.tsx) wrapping the whole app.

Any UI component reads the name like this:

```tsx
import { useAgentName } from '@/components/AgentNameProvider';

const agentName = useAgentName(); // "Luna" by default
```

The provider accepts an optional `name` prop. When no prop is passed it falls
back to `DEFAULT_AGENT_NAME`. This is the seam the backend wires into.

---

## 2. Current default & how to override it

- **Current default value:** `"Luna"`, defined as `DEFAULT_AGENT_NAME` in
  `components/AgentNameProvider.tsx`. It is also marked with:

  ```
  // TODO(backend): replace default with agent name from store settings.
  ```

- **How to override once a real value exists:** pass it into the provider in
  `app/layout.tsx` (or a nearer server/client wrapper that has access to the
  store settings):

  ```tsx
  <AgentNameProvider name={storeSettings.agent_name /* may be undefined */}>
  ```

  Because the `name` prop defaults to `DEFAULT_AGENT_NAME`, passing `undefined`
  or omitting it keeps the safe `"Luna"` fallback — so the override is
  non-breaking.

> Note: `app/layout.tsx` is a Server Component, while `AgentNameProvider` is a
> Client Component. Passing a fetched value through the `name` prop is fine
> (server → client serializable string). The cleanest wiring is to read the
> store's `agent_name` server-side and pass it straight into the provider prop.

---

## 3. What the backend needs to provide

A per-store / per-brand agent name field.

| Item | Detail |
| --- | --- |
| Field name | `agent_name` |
| Location | Store/brand **settings** table (one value per store) |
| Type | string |
| Default | `"Luna"` |
| Validation | non-empty after trim; if empty/missing → fall back to `"Luna"` |
| Length cap | recommend **1–24 characters** (it renders in the sidebar header, page titles, and card copy — longer names will overflow tight UI) |
| Allowed chars | plain display text; trim whitespace; reject control characters |

Suggested API surface (to be designed by backend — **not implemented here**):

- `GET` store settings should include `agent_name`.
- `PUT`/`PATCH` store settings should accept `agent_name` with the validation
  above. (The frontend settings input for editing this does **not exist yet** —
  it is intentionally out of scope for this pass.)

---

## 4. System-prompt injection — SEPARATE, CAREFUL TASK

The name must **also** be injected into the agent's system prompt so the model
introduces itself with the configured name. **This is a separate task from the
display wiring above and must be done carefully.**

Hard rules for whoever wires this:

- **Only substitute the name variable.** Do **not** alter the identity,
  escalation, or non-AI / "never claim to be human" logic in the system prompt.
- Keep the same guardrails, tone instructions, and behavioral rules intact —
  swap only the literal name token.
- Apply the same non-empty fallback to `"Luna"` so the prompt is never built
  with an empty name.
- This pass did **not** touch the system prompt in any way.

---

## 5. Exact list of files this frontend pass touched

- `components/AgentNameProvider.tsx` — **new.** Source-of-truth context, default
  constant, `useAgentName()` hook, and `AgentNameProvider`.
- `app/layout.tsx` — mounts `<AgentNameProvider>` around the app.
- `components/LunaSidebar.tsx` — sidebar header (desktop + mobile) now reads the
  name via `useAgentName()`.
- `app/dashboard/luna/knowledge-base/page.tsx` — the **Customize** page: title
  ("teach {name} how to be yours"), card titles, card subtitle copy (Task 1),
  drawer titles, and in-drawer copy/placeholder now read the name via
  `useAgentName()`.
- `AGENT_NAME_INTEGRATION.md` — **new.** This document.

> Not renamed: the `LunaSidebar` / `LunaTopBarActions` component file/identifier
> names and the `/dashboard/luna` route path were left as-is (internal names,
> not user-facing display copy).

---

## Onboarding Checklist

An inline, dismissible **setup checklist** now appears at the top of the
**Customize** page to guide new users through teaching their agent. It is
**display-only** right now: completion is mocked and dismiss is session state.
Like the agent name, it reuses `useAgentName()` for all name copy — it does not
duplicate that source of truth.

> It is **not** a blocking modal. It never covers or gates the dashboard — the
> cards underneath are usable immediately, and the panel can be dismissed.

### Where it reads completion state (currently mocked)

- **File (single source of truth):** [`lib/onboarding.ts`](lib/onboarding.ts)
- **Variable:** `ONBOARDING_STEPS` — an array with a `completed: boolean` per
  step, all hardcoded `false` for now, marked with:

  ```
  // TODO(backend): replace mock completion with real per-store setup status.
  ```

  Plus helpers `incompleteRequiredCount()` and `isSetupComplete()` (the
  optional/PRO voice step does not count toward "complete").

- **Dismiss state:** `onboardingDismissed` — local `useState` in the Customize
  page, **session-only** (resets on refresh, by design for now). Marked with a
  `// TODO(backend): persist a "dismissed/completed" flag …` comment.

The checklist derives its progress bar and "X of N done" purely from the
`completed` flags. No real completion detection is attempted on the frontend.

> ⚠️ **Single source of truth — required.** `lib/onboarding.ts` is the **one**
> place onboarding completion is read from. The Customize checklist progress bar
> ("X of 4 done"), the **sidebar setup-incomplete dot** (see below), and any
> future setup signal **must all read this same module**. Do not fork or add a
> second completion source — if two signals disagree about setup status, that is
> a bug. When wiring the backend, replace the mock in this one file (or feed it
> from real per-store status) and every signal updates together.

### Sidebar setup-incomplete dot

- **File:** [`components/LunaSidebar.tsx`](components/LunaSidebar.tsx)
- A small green dot appears on the **Customize** nav item, using the same dot
  visual already used on the Customize cards (`bg-green-400/80`).
- It reads `isSetupComplete()` from `lib/onboarding.ts` (the **existing**
  onboarding source — not a new one) and shows while **any required step is
  incomplete**, hiding completely at 100% (the optional/PRO voice step does not
  block).
- Subtle by design — a quiet nudge, not a red alert.

### The four steps & the backend condition that should mark each done

Step copy is **action + benefit** phrasing (verb-first title, payoff helper),
defined in `stepCopy()` in the Customize page. It is **intentionally decoupled
from the card titles/subtitles**: editing card copy does not require editing the
checklist, and vice versa. The `{name}` token comes from `useAgentName()`.

| # | Step title (UI) | Card the "Go"/"Edit" routes to (unchanged) | Required? | Backend "done" condition |
| --- | --- | --- | --- | --- |
| 1 | Start here: teach {name} your top questions | "What {name} knows" | Required | Store has **≥1 FAQ / policy entry** (e.g. a non-empty answer for delivery/refund, or any custom FAQ). |
| 2 | Tell {name} what to watch for | "How {name} acts" | Required | **≥1 "how it acts" situation** configured (and/or situations enabled). |
| 3 | Add your sizing info | "Products & Sizing" | Required | **≥1 product / size guide entry** present. |
| 4 | Make {name} sound like your brand | "{name}'s Voice" | **Optional (PRO)** | Voice profile set (a DM-history voice training file uploaded/processed). |

> **Destinations are unchanged.** The friendlier copy does **not** introduce a
> guided per-step flow — each step's "Go" (and the "Edit" link on a completed
> step) still routes to the **same existing card** via `handleGoToStep()`
> (scroll to the card + open its drawer). No new flow was built.

These conditions are a **backend concern** — do **not** compute them on the
frontend. The frontend should just read per-step status the backend provides
and map it onto `ONBOARDING_STEPS[i].completed`.

### Collapse-on-complete behavior (frontend, session only)

The panel is temporary scaffolding and shrinks as steps complete:

- A step with `completed: true` collapses to a **compact done row** — checked
  indicator, struck/muted title, helper line hidden, and the "Go" button
  replaced by a subtle **"Edit"** link (same destination via `handleGoToStep`).
- Completed steps **sort below** incomplete ones so the next action stays at the
  top; each step keeps its original number regardless of sort order.
- When **all required steps are complete** (`isSetupComplete()` — PRO/voice does
  not block), the **entire panel auto-hides**, reusing the same hidden treatment
  as the dismiss (X) button.
- The progress bar and "X of 4 done" continue to read the same shared mock
  source (`ONBOARDING_STEPS`) — not forked.

> ⚠️ This auto-hide is **session state only** (it recomputes from the mock each
> load). "Stays hidden permanently once complete" is the **backend's job** — see
> the persistence requirement below.

### What the backend must persist (per store)

1. **Per-step completion status** — so each row shows done/not-done from real
   data (steps 1–3 required, step 4 optional).
2. **A "checklist dismissed / completed" flag** — so the panel stops
   reappearing once the user has finished (or permanently dismissed) setup.

### Desired final behavior (to implement when wiring backend)

- The checklist is **dismissible**, but **reappears on the next visit** as long
  as any **required** step (1–3) is still incomplete.
- Once **all required steps are complete**, it should **never show again**
  (step 4 / voice is optional and does not block completion).
- The current frontend approximates only the dismiss interaction (session
  `useState`); the "reappears until complete" and "never again once complete"
  logic depends on the persisted flags above and is **not** implemented yet.

### Files touched by the onboarding pass

- `lib/onboarding.ts` — **the shared mock** `ONBOARDING_STEPS` + completion
  helpers (single source of truth; originally added inline in the Customize page
  and later extracted here so the sidebar dot can reuse it).
- `app/dashboard/luna/knowledge-base/page.tsx` — `stepCopy()` action/benefit
  label+helper map (decoupled from card copy), `onboardingDismissed` session
  state, per-card refs + `handleGoToStep()` (scrolls to the card and opens its
  drawer — used by both "Go" and the completed-step "Edit" link), the inline
  checklist panel with **collapse-on-complete** (compact done rows, completed
  steps sorted below incomplete, full-panel auto-hide via `isSetupComplete()`);
  imports `ONBOARDING_STEPS` and `isSetupComplete` from `lib/onboarding.ts`.
- `components/LunaSidebar.tsx` — setup-incomplete dot on the Customize item,
  reading `isSetupComplete()` from `lib/onboarding.ts`.
- `AGENT_NAME_INTEGRATION.md` — this section.

No backend, route, DB, persistence, real completion logic, or system-prompt code
was touched.

---

## Notifications

A **notifications bell + dropdown** now lives in the dashboard top bar
([`components/LunaTopBarActions.tsx`](components/LunaTopBarActions.tsx)), next to
the theme toggle and account avatar. This is a **separate system** from
onboarding: notifications are **transient events**, onboarding is **persistent
setup state** — they do not share state and must not be entangled.

v1 is **bell + dropdown only** — no notifications page, settings, or filtering.
Everything is mocked and display-only: no real feed, no websocket, no polling.

### Where the frontend reads notifications (currently mocked)

- **File:** [`lib/notifications.ts`](lib/notifications.ts)
- **Variable:** `MOCK_NOTIFICATIONS` — an array of `AppNotification`, marked with:

  ```
  // TODO(backend): replace mock notifications with real event feed.
  ```

- **Unread/read state:** local `useState` in `LunaTopBarActions.tsx`
  (`notifications`, `unreadCount`, `markAllRead`, per-item mark-read on click).
  **Session-only — resets on refresh, by design for now.**

### Event types, their backend origin, and routing target

| Type (`NotificationType`) | Backend origin (which system emits it) | Routes to |
| --- | --- | --- |
| `escalation` | When the agent escalates a conversation / an Issue is created | `/dashboard/luna/issues` (or the specific conversation) |
| `new_order` | Shopify **order webhook** (order placed through chat) | `/dashboard/luna/conversations` (or the specific order/conversation) |
| `new_exchange` | Exchanges/returns flow (customer requests an exchange) | `/dashboard/luna/exchanges-refunds` |

Default routes per type live in `NOTIFICATION_DEFAULT_HREF`; each notification
also carries its own `href` so the backend can deep-link a **specific**
conversation / order / exchange. Adding a new type later is trivial: add it to
`NotificationType`, `NOTIFICATION_TYPE_LABEL`, `NOTIFICATION_DEFAULT_HREF` in
`lib/notifications.ts`, and a glyph case in the `NotificationIcon` component.

### What the backend must provide

1. **A notification feed per store** — the real event list replacing
   `MOCK_NOTIFICATIONS`, each with type, label, real timestamp, and target href.
2. **Unread/read status persistence** — so read state survives refresh and syncs
   across devices/sessions (the current frontend resets on refresh).
3. **Real-time delivery (later decision, not built now)** — websocket vs.
   polling vs. SSE is an explicit backend choice to be made when wired; v1 does
   **not** implement any transport.

### Files touched by the notifications pass

- `lib/notifications.ts` — **new.** `MOCK_NOTIFICATIONS`, `AppNotification`,
  `NotificationType`, `NOTIFICATION_TYPE_LABEL`, `NOTIFICATION_DEFAULT_HREF`.
- `components/LunaTopBarActions.tsx` — bell button + unread badge, dropdown list,
  empty state ("You're all caught up"), mark-all-read, per-type icon, and
  click-to-navigate.
- `AGENT_NAME_INTEGRATION.md` — this section.

No backend, route, DB, real event source, websocket/polling, persistence, or
system-prompt code was touched.
