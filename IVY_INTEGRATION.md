# Ivy — Backend & Database Integration Guide

**Agent:** Ivy — Financial Visibility · Krew
**Frontend status:** Fully built against a mock data layer. Every page, mutation, and export works today with in-memory data.
**Your job (backend):** Stand up the database + a thin REST API that serves the six tables below. Swapping the frontend from mock to live touches **one file**.

Currency is **EGP** throughout. All money columns are amounts in EGP (store as `numeric`, not cents — the frontend formats with `formatEGP`).

---

## Table of Contents

1. [Architecture — the single data seam](#1-architecture--the-single-data-seam)
2. [Auth & brand scoping](#2-auth--brand-scoping)
3. [Database schema (Supabase / Postgres)](#3-database-schema-supabase--postgres)
4. [Derived metrics — business rules](#4-derived-metrics--business-rules)
5. [REST API surface](#5-rest-api-surface)
6. [Integrations (Bosta, Shopify, Telegram)](#6-integrations-bosta-shopify-telegram)
7. [Wiring the frontend: mock → live](#7-wiring-the-frontend-mock--live)
8. [Enum reference](#8-enum-reference)
9. [Seed / demo data](#9-seed--demo-data)

---

## 1. Architecture — the single data seam

The entire Ivy dashboard reads and writes through **one module**:

```
lib/ivy/ivyClient.ts     ← THE data seam. Backed by an in-memory store today.
lib/ivy/types.ts         ← Row types. Mirror the DB schema EXACTLY (table → interface).
components/IvyProvider.tsx← Subscribes React to the store (useSyncExternalStore → useIvy()).
```

**The most important fact for the backend:** all reporting logic — P&L, net profit, margins, return rate, channel mix, cash runway — is computed **client-side** in pure **selectors** over the raw rows (see the `select*` functions in `ivyClient.ts`). 

➡️ **You do not need to build analytics/P&L endpoints.** You need CRUD on six tables. The client does the math. (An optional server-side aggregation path is noted in §5 for when data volume outgrows client compute.)

Data flow:

```
Postgres (6 tables)
   → GET /api/ivy  (bootstrap: all rows for the brand)
      → ivyClient store (IvyState)
         → selectors (pure functions)  → pages render
Mutations (add expense / pool / revenue / channel …)
   → POST/PATCH/DELETE /api/ivy/*  → DB
      → refetch or optimistic store update
```

---

## 2. Auth & brand scoping

Same convention as Luna (see `API_DOCUMENTATION.md`): bearer token in `Authorization: Bearer <token>`, stored in `localStorage.auth_token` (`lib/auth.ts`).

Every Ivy row is scoped to a **brand** (`brand_id`). The mock uses a constant `brand_id = 'brand-demo'`; live, derive `brand_id` from the authenticated user's brand — **never trust a client-supplied `brand_id`**. Enforce with RLS (§3).

---

## 3. Database schema (Supabase / Postgres)

Six core tables + two optional state tables. DDL below is the source of truth; the TS interfaces in `lib/ivy/types.ts` mirror it column-for-column.

### 3.1 Enums

```sql
create type expense_category as enum (
  'inventory_materials','marketing_ads','shipping_fulfillment','salaries',
  'packaging','software','rent_utilities','fees_commissions','other'
);

create type expense_source as enum ('text','voice','receipt');

create type capital_color as enum ('teal','obsidian','silver','copper','indigo','rose');

create type revenue_channel_kind as enum ('online','showroom','retail','wholesale','popup','other');

create type revenue_source as enum ('bosta','shopify','manual');
```

### 3.2 Tables

```sql
-- Capital pools — pots of injected money that expenses deduct from.
create table capitals (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references brands(id) on delete cascade,
  name            text not null,
  initial_amount  numeric(14,2) not null check (initial_amount >= 0),
  current_balance numeric(14,2) not null,      -- see note below
  color           capital_color not null default 'teal',
  created_at      timestamptz not null default now()
);

-- Operating expenses — each deducts from exactly one capital pool.
create table expenses (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references brands(id) on delete cascade,
  amount      numeric(14,2) not null check (amount > 0),
  category    expense_category not null,
  capital_id  uuid not null references capitals(id) on delete restrict,
  source      expense_source not null default 'text',
  note        text not null default '',
  spent_at    timestamptz not null default now()
);

-- Revenue channels — where money comes in (online store, showroom, stockist…).
create table revenue_channels (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references brands(id) on delete cascade,
  name        text not null,
  kind        revenue_channel_kind not null,
  created_at  timestamptz not null default now()
);

-- Revenue snapshots — one row per revenue event/period per channel.
-- Online rows are written by the Bosta sync; the rest are logged manually.
create table revenue_snapshots (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references brands(id) on delete cascade,
  channel_id      uuid not null references revenue_channels(id) on delete cascade,
  date            timestamptz not null,          -- period-ending date of the snapshot
  gross_delivered numeric(14,2) not null check (gross_delivered >= 0),
  returns         numeric(14,2) not null default 0 check (returns >= 0),
  net_revenue     numeric(14,2) generated always as (gross_delivered - returns) stored,
  source          revenue_source not null default 'manual'
);

-- Inventory — ONE row per brand. Read-only in the UI; written by the Shopify sync.
create table inventory (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null unique references brands(id) on delete cascade,
  inventory_value numeric(14,2) not null default 0,   -- Σ units × price, from Shopify
  units           integer not null default 0,
  updated_at      timestamptz not null default now()
);

-- Sales target — ONE row per brand. Powers the "inventory vs target" insight.
create table targets (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null unique references brands(id) on delete cascade,
  sales_target  numeric(14,2) not null default 0,
  period        text not null default 'monthly'
);
```

**`capitals.current_balance` — important design note.** The frontend treats this as a stored column and adjusts it on every expense (`current_balance -= amount`) and on pool edit (rebalanced to preserve recorded spend). To avoid drift server-side you have two valid options:

- **(Recommended) Compute it.** Make `current_balance` a read-time derivation: `initial_amount − COALESCE(Σ expenses.amount where capital_id = this, 0)`. Expose it as a view/computed field in the API response so the shape still matches `Capital`. Then `POST /expenses` needs no balance write.
- **Store + maintain it** via a trigger on `expenses` insert/delete. Simpler API shape, but you own the invariant.

Either way the API must return `current_balance` on every capital.

### 3.3 Indexes

```sql
create index on expenses (brand_id, spent_at desc);
create index on expenses (capital_id);
create index on revenue_snapshots (brand_id, date desc);
create index on revenue_snapshots (channel_id);
create index on revenue_channels (brand_id);
create index on capitals (brand_id);
```

### 3.4 Row-Level Security (brand isolation)

```sql
alter table capitals          enable row level security;
alter table expenses          enable row level security;
alter table revenue_channels  enable row level security;
alter table revenue_snapshots enable row level security;
alter table inventory         enable row level security;
alter table targets           enable row level security;

-- Pattern (repeat per table). Assumes a helper that maps auth.uid() → brand_id.
create policy brand_isolation on capitals
  using (brand_id = auth_brand_id())
  with check (brand_id = auth_brand_id());
```

### 3.5 Optional state tables

These back two pieces of state the frontend keeps client-side today. Add them only if you want persistence across sessions/devices.

```sql
-- Persist "Ivy on/off" + currency (today: client-only `ivyEnabled`).
create table ivy_settings (
  brand_id    uuid primary key references brands(id) on delete cascade,
  ivy_enabled boolean not null default true,
  currency    text not null default 'EGP',
  updated_at  timestamptz not null default now()
);

-- Persist dismissed overview nudges (today: client-only `dismissedNudgeIds`).
create table ivy_nudge_dismissals (
  brand_id     uuid not null references brands(id) on delete cascade,
  nudge_id     text not null,
  dismissed_at timestamptz not null default now(),
  primary key (brand_id, nudge_id)
);
```

Nudges themselves are **generated**, not stored — see §4.6.

---

## 4. Derived metrics — business rules

These formulas are implemented in `ivyClient.ts` selectors and run **on the client**. Documented here so (a) you understand what the raw rows feed, and (b) any server-side reporting matches exactly. Function names in `()` are the source of truth.

### 4.1 Period windows (`periodRange`)

The dashboard has three windows, all computed from "now":

| Period        | Start                                   | End                                  |
|---------------|-----------------------------------------|--------------------------------------|
| `this_month`  | 1st of current month, 00:00             | now                                  |
| `last_month`  | 1st of previous month                   | last day of previous month, 23:59:59 |
| `last_90`     | now − 90 days                           | now                                  |

Trend deltas compare against the **previous** window (`previousRange`): `this_month`→`last_month`, `last_month`→the month before, `last_90`→`[now−180d, now−90d]`. A row is "in" a window if its timestamp (`expenses.spent_at` / `revenue_snapshots.date`) falls within `[start, end]`.

### 4.2 Row-level & period revenue

- `revenue_snapshots.net_revenue = gross_delivered − returns` (generated column).
- **Period net revenue** = `Σ gross_delivered − Σ returns` over snapshots in the window.

### 4.3 Net profit (`selectPeriodMetrics`)

```
period_expenses = Σ expenses.amount where spent_at ∈ window
net_profit      = period_net_revenue − period_expenses
```

### 4.4 Cash remaining (`selectCashRemaining`) — period-independent

```
injected   = Σ capitals.initial_amount
remaining  = Σ capitals.current_balance      (= injected − Σ all expenses)
```

### 4.5 Return rate (`selectPeriodMetrics`) — ONLINE ONLY

Return rate is a COD-delivery metric, so it is computed **only over channels where `kind = 'online'`** — showroom/retail revenue must not dilute it:

```
online_gross   = Σ gross_delivered for snapshots whose channel.kind = 'online'
online_returns = Σ returns          for those same snapshots
return_rate    = online_returns / online_gross × 100     (null if online_gross = 0)
```

### 4.6 Channel breakdown & P&L (`selectChannelBreakdown`, `selectPnL`)

Per channel over the window: `gross`, `returns`, `net = gross − returns`, `sharePct = net / Σ net × 100`.

The P&L statement (`PnLStatement`):

```
grossRevenue   = Σ channel.gross
totalReturns   = Σ channel.returns
netRevenue     = grossRevenue − totalReturns
expenses[]     = Σ expenses.amount grouped by category (period)
totalExpenses  = Σ expenses[]
netProfit      = netRevenue − totalExpenses
marginPct      = netProfit / netRevenue × 100          (null if netRevenue = 0)
```

### 4.7 Reports-only derived values (`app/dashboard/ivy/reports/page.tsx`)

```
expenseRatio  = totalExpenses / netRevenue × 100
monthly_burn  = (last_90 window expenses) / 3          -- trailing 90-day average
cash_runway   = cash_remaining / monthly_burn          (months)
```

### 4.8 Inventory vs target (overview)

```
inventoryPct = inventory.inventory_value / targets.sales_target × 100
gap          = targets.sales_target − inventory.inventory_value
```

### 4.9 Nudges (overview alerts)

Dismissible overview alerts (`Nudge`) are **generated from the metrics**, not stored. Today they're seeded client-side; a natural backend home is a rules pass that emits `{ id, severity, message, href }` when thresholds trip (e.g. return rate ≥ 25%, capital ≥ 80% spent). Dismissals are client-only unless you add `ivy_nudge_dismissals` (§3.5). Keep nudge `id`s stable so dismissals persist.

---

## 5. REST API surface

All under `/api/ivy`, brand-scoped from the token. Request/response shapes match the TS interfaces in `lib/ivy/types.ts`.

### 5.1 Bootstrap (the one read the app needs)

```
GET /api/ivy
→ {
    capitals:          Capital[],
    expenses:          Expense[],
    revenue_channels:  RevenueChannel[],
    revenue_snapshots: RevenueSnapshot[],
    inventory:         Inventory,        // single row
    target:            Target,           // single row
    ivy_enabled:       boolean
  }
```

`IvyProvider` populates the whole store from this in one call on mount. Everything else the pages need is derived client-side.

### 5.2 Capitals

| Method & path | Body | Returns | Notes |
|---|---|---|---|
| `POST /api/ivy/capitals` | `{ name, initial_amount, color }` | `Capital` | `current_balance` starts = `initial_amount`. Maps to `ivyClient.addCapital`. |
| `PATCH /api/ivy/capitals/:id` | `{ name, initial_amount, color }` | `Capital` | Rebalance: `current_balance = initial_amount − spent`, where `spent = old.initial_amount − old.current_balance`. Maps to `updateCapital`. |
| `DELETE /api/ivy/capitals/:id` | — | `204` | **`409` if the pool has expenses** (FK `on delete restrict`). Frontend already disables delete in that case. Maps to `deleteCapital`. |

### 5.3 Expenses

| Method & path | Body | Returns | Notes |
|---|---|---|---|
| `POST /api/ivy/expenses` | `{ amount, category, capital_id, source, note, spent_at }` | `Expense` | Also decrement `capitals.current_balance` by `amount` (or recompute — see §3.2). Maps to `ivyClient.addExpense`. |

`GET`/`DELETE` for expenses aren't consumed by the UI yet (the bootstrap already returns them) — add if you want an edit/delete flow later.

### 5.4 Revenue channels

| Method & path | Body | Returns | Notes |
|---|---|---|---|
| `POST /api/ivy/revenue-channels` | `{ name, kind }` | `RevenueChannel` | Maps to `addRevenueChannel`. The "+ New channel" flow in the Add-revenue drawer creates a channel then immediately posts an entry to it. |

### 5.5 Revenue snapshots (entries)

| Method & path | Body | Returns | Notes |
|---|---|---|---|
| `POST /api/ivy/revenue-snapshots` | `{ channel_id, date, gross_delivered, returns }` | `RevenueSnapshot` | Sets `source = 'manual'`. `net_revenue` is generated. Maps to `addRevenueEntry`. |

Online snapshots (`source = 'bosta'`) are **not** created via this endpoint — the Bosta sync writes them (§6).

### 5.6 Inventory & target

| Method & path | Body | Returns | Notes |
|---|---|---|---|
| `GET /api/ivy/inventory` | — | `Inventory` | Read-only in UI; value+units come from the Shopify sync. |
| `PUT /api/ivy/inventory` | `{ inventory_value, units }` | `Inventory` | Called by the **sync job**, not the UI. Sets `updated_at`. |
| `PUT /api/ivy/target` | `{ sales_target, period }` | `Target` | No UI writer today (target editing was moved out of Inventory into forecasting); keep the endpoint for when forecasting lands. |

### 5.7 Settings

| Method & path | Body | Returns | Notes |
|---|---|---|---|
| `GET /api/ivy/settings` | — | `{ ivy_enabled, currency }` | Optional (`ivy_settings` table). |
| `PUT /api/ivy/settings` | `{ ivy_enabled }` | `{ ivy_enabled }` | Backs the top-bar Ivy toggle (`toggleIvyEnabled`). |

### 5.8 Optional: server-side reporting

Only if client compute becomes a bottleneck (very large brands). Mirror the selectors exactly (§4):

```
GET /api/ivy/pnl?period=this_month|last_month|last_90   → PnLStatement
GET /api/ivy/metrics?period=…                            → PeriodMetrics
```

Until then, **don't build these** — the client already produces them from the bootstrap rows, and the PDF/Excel exports run entirely client-side off the same selector output.

---

## 6. Integrations (Bosta, Shopify, Telegram)

Ivy's raw rows are fed by three external sources. Each is a **write path into the tables above** — the dashboard doesn't call these services directly.

### 6.1 Bosta → `revenue_snapshots` (online) + return rate

Bosta is the COD courier. A sync job pulls delivered vs returned COD orders and writes `revenue_snapshots` rows for the brand's **online** channel with `source = 'bosta'`:
- `gross_delivered` = delivered COD value
- `returns` = returned COD value
- `date` = the settlement/period-ending date

This is what makes the **return rate** real (§4.5) — the "returns Shopify can't see". Cadence: daily or per-settlement.

Endpoints (brand-facing connect flow, mirror Luna's Bosta hooks in `API_DOCUMENTATION.md`):
```
POST   /api/integrations/bosta/connect     { api_key }
DELETE /api/integrations/bosta/disconnect
```

### 6.2 Shopify → `inventory`

A sync job computes `Σ units in stock × their prices` from the Shopify catalog and upserts the brand's single `inventory` row (`inventory_value`, `units`, `updated_at`) via `PUT /api/ivy/inventory`. Inventory is **read-only in the UI** by design — Shopify is the source of truth. Shopify is already connected for Luna (`/api/integrations/shopify/*`); reuse that connection.

### 6.3 Telegram → `expenses`

The Telegram agent (previewed on the Activity page; not yet wired) logs expenses via slot-filling — a voice note "bought fabrics for 20K" → confirm pool → logged. On confirmation it calls `POST /api/ivy/expenses` with `source` = `text` | `voice` | `receipt` depending on the input modality. Until it ships, expenses are added through the dashboard's Add-expense drawer (same endpoint).

---

## 7. Wiring the frontend: mock → live

**You only edit `lib/ivy/ivyClient.ts` (and its provider load).** `types.ts`, all pages, all selectors, and the exporters stay untouched — they operate on `IvyState` and are agnostic to where it came from.

### Step 1 — Load real data on mount

`IvyProvider` currently reads a synchronous singleton. Change it to fetch the bootstrap and hydrate the store:

```ts
// components/IvyProvider.tsx (sketch)
useEffect(() => {
  fetch('/api/ivy', { headers: authHeader() })
    .then(r => r.json())
    .then(data => ivyClient.hydrate(mapBootstrap(data))); // new method that calls set()
}, []);
```

Add a `hydrate(state: IvyState)` method on the client that replaces the store and notifies listeners (a one-liner over the existing private `set`). Keep an initial empty/loading `IvyState` so pages render skeletons until it lands.

### Step 2 — Turn each mutation into an API call

Every `ivyClient` mutation maps 1:1 to an endpoint (§5). Two valid strategies:

- **Optimistic (snappy):** apply the local `set(...)` exactly as today, fire the request, and on failure revert. This preserves the instant-feedback UX (the whole app already reacts to the local write).
- **Refetch (simple):** `await` the POST, then re-run the bootstrap (or merge the returned row) and `set(...)`.

Mapping:

| `ivyClient` method | Endpoint |
|---|---|
| `addExpense` | `POST /api/ivy/expenses` |
| `addCapital` | `POST /api/ivy/capitals` |
| `updateCapital` | `PATCH /api/ivy/capitals/:id` |
| `deleteCapital` | `DELETE /api/ivy/capitals/:id` |
| `addRevenueChannel` | `POST /api/ivy/revenue-channels` |
| `addRevenueEntry` | `POST /api/ivy/revenue-snapshots` |
| `toggleIvyEnabled` | `PUT /api/ivy/settings` |
| `dismissNudge` | client-only (or `POST /api/ivy/nudge-dismissals`) |

### Step 3 — Shape parity checklist

- API returns dates as **ISO strings** (the types use `string`, e.g. `spent_at`, `date`, `created_at`).
- `revenue_snapshots.net_revenue` and `capitals.current_balance` must be **present in responses** (generated/computed server-side) — selectors read them directly.
- Enum values must match §8 exactly (lowercase, underscored).
- `inventory` and `target` are **single objects**, not arrays.

That's the whole migration. Because all reporting is client-side, once the bootstrap returns real rows, the P&L, charts, metrics, and PDF/Excel exports light up with no further work.

---

## 8. Enum reference

| Enum | Values |
|---|---|
| `expense_category` | `inventory_materials`, `marketing_ads`, `shipping_fulfillment`, `salaries`, `packaging`, `software`, `rent_utilities`, `fees_commissions`, `other` |
| `expense_source` | `text`, `voice`, `receipt` |
| `capital_color` | `teal`, `obsidian`, `silver`, `copper`, `indigo`, `rose` |
| `revenue_channel_kind` | `online`, `showroom`, `retail`, `wholesale`, `popup`, `other` |
| `revenue_source` | `bosta`, `shopify`, `manual` |

Display labels for each live in `lib/ivy/types.ts` (`*_LABEL` maps) — the DB stores only the keys.

**`kind = 'online'` is load-bearing:** the return-rate metric (§4.5) filters on it. A brand should have exactly one online channel (the Shopify/Bosta-fed store); everything else is manual.

---

## 9. Seed / demo data

The mock seed (in `ivyClient.ts`) is a realistic single-brand fixture — reuse it for staging/demo so the dashboard tells the same story:

- **Capital:** 1 pool "Main Operating Capital", `initial_amount` 500,000, ~400,000 spent → `current_balance` 100,000 (80% spent), color `teal`.
- **Expenses:** 11 rows across all categories and all three sources, split between this month and last month.
- **Revenue channels:** `Online Store` (`online`), `Zamalek Showroom` (`showroom`), `Retail Stockists` (`retail`).
- **Revenue snapshots:** online fed as if from Bosta (this month ≈ 800K gross / 224K returns → 28% return rate); showroom + retail as manual entries with zero returns.
- **Inventory:** `inventory_value` 700,000, `units` 1,400 (≈ EGP 500 avg).
- **Target:** `sales_target` 1,000,000, `period` monthly.

Dates in the mock are anchored relative to "now" so every period window has data. For a real seed, spread `spent_at`/`date` across the current and previous two months similarly.

---

*Questions on any formula → read the matching `select*` function in `lib/ivy/ivyClient.ts`; it's the executable spec. Keep this doc and that file in lockstep.*
