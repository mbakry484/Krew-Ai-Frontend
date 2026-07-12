// =============================================================================
// IVY — FINANCIAL VISIBILITY · data client (THE single data seam)
// =============================================================================
// This module is the ONLY data access point for the Ivy dashboard. Today it is
// backed by an in-memory client-side store seeded with realistic mock data;
// swapping to real Supabase/API later should touch THIS FILE ONLY:
//   - keep the public surface (ivyClient methods + selectors) identical
//   - replace the seed + synchronous mutations with fetches/mutations
//
// Backend notes (future API surface):
//   GET    /api/ivy/capitals             → Capital[]
//   POST   /api/ivy/capitals             → { name, initial_amount }
//   GET    /api/ivy/expenses             → Expense[]
//   POST   /api/ivy/expenses             → { amount, category, capital_id, source, note, spent_at }
//   GET    /api/ivy/revenue-channels     → RevenueChannel[]
//   POST   /api/ivy/revenue-channels     → { name, kind }
//   GET    /api/ivy/revenue-snapshots    → RevenueSnapshot[]   (online fed by Bosta; manual via POST)
//   POST   /api/ivy/revenue-snapshots    → { channel_id, date, gross_delivered, returns }
//   GET/PUT /api/ivy/inventory           → Inventory
//   GET/PUT /api/ivy/target              → Target
//
// Derived metrics (business rules, keep in sync with backend):
//   net_profit     = net_revenue (delivered − returns) − expenses in period
//   cash_remaining = Σ capital injected − Σ deductions (period-independent)
// =============================================================================

import {
  AlertPreferences,
  Capital,
  CapitalColor,
  DEFAULT_ALERT_PREFERENCES,
  Expense,
  ExpenseCategory,
  ExpenseSource,
  Inventory,
  InventoryAlert,
  IvyPeriod,
  Nudge,
  OnboardingStep,
  Product,
  RevenueChannel,
  RevenueChannelKind,
  RevenueSnapshot,
  Target,
  TelegramLinkCode,
} from './types';
import {
  completeIvyOnboarding,
  createIvyCapital,
  createIvyExpense,
  deleteIvyCapital,
  dismissIvyAlert,
  updateIvyAlertPreferences,
  updateIvyCapital,
  updateIvyProductCost,
} from '@/lib/api';

const BRAND_ID = 'brand-demo';

// ── State shape ───────────────────────────────────────────────────────────────

export interface IvyState {
  capitals: Capital[];
  expenses: Expense[];
  revenueChannels: RevenueChannel[];
  revenueSnapshots: RevenueSnapshot[];
  inventory: Inventory;
  target: Target;
  nudges: Nudge[];
  dismissedNudgeIds: string[];
  /** Agent on/off — mirrors Luna's global toggle pattern (client state only). */
  ivyEnabled: boolean;
  /** Product/variant inventory read-model (Shopify sync + Ivy costs). */
  products: Product[];
  /** Inventory alerts + client-side dismissed set. */
  alerts: InventoryAlert[];
  dismissedAlertIds: string[];
  alertPreferences: AlertPreferences;
  /** First-open onboarding — progress persisted to localStorage per brand. */
  onboarding: {
    /** false until localStorage is read on the client (prevents flash). */
    hydrated: boolean;
    completed: boolean;
    telegramLinked: boolean;
    step: OnboardingStep;
    /** Overview Telegram-nudge banner dismissed for this session/brand. */
    bannerDismissed: boolean;
  };
  telegramLinkCode: TelegramLinkCode | null;
}

// ── Seed helpers ──────────────────────────────────────────────────────────────
// Seed dates are anchored to "now" so the This month / Last month / Last 90
// days windows always contain data regardless of when the mock is viewed.

const now = new Date();

/** A date `monthOffset` calendar months back, clamped to a valid day. */
function monthDate(monthOffset: number, day: number): string {
  const y = now.getFullYear();
  const m = now.getMonth() - monthOffset;
  // For the current month never seed a future date.
  const maxDay = monthOffset === 0 ? now.getDate() : 28;
  const d = new Date(y, m, Math.min(day, maxDay), 11, 30, 0);
  return d.toISOString();
}

let seedSeq = 0;
const sid = (prefix: string) => `${prefix}-${++seedSeq}`;

function snapshot(
  monthOffset: number,
  day: number,
  gross: number,
  returns: number,
  channelId = 'ch-online',
  source = 'bosta',
): RevenueSnapshot {
  return {
    id: sid('rev'),
    brand_id: BRAND_ID,
    channel_id: channelId,
    date: monthDate(monthOffset, day),
    gross_delivered: gross,
    returns,
    net_revenue: gross - returns,
    source,
  };
}

// ── Inventory products seed (Shopify sync mock) ───────────────────────────────
// A realistic apparel catalog: best sellers running low, dead stock, and a
// deliberate ~70% cost coverage so the "add missing costs" nudge has teeth.
// Replaced wholesale once GET /api/ivy/inventory/products is live.

const daysOf = (units: number, velocity: number): number | null =>
  velocity > 0 ? Math.round(units / velocity) : null;

const daysAgo = (n: number): string => new Date(now.getTime() - n * 86_400_000).toISOString();

function product(
  variantId: string,
  productTitle: string,
  variantTitle: string,
  unitsInStock: number,
  sellingPrice: number,
  unitCost: number | null,
  velocity30d: number,
  isBestSeller: boolean,
  lastSaleDaysAgo: number | null,
): Product {
  return {
    variantId,
    productTitle,
    variantTitle,
    imageUrl: null,
    unitsInStock,
    sellingPrice,
    unitCost,
    costSource: unitCost != null ? 'shopify' : null,
    velocity30d,
    daysOfStock: daysOf(unitsInStock, velocity30d),
    isBestSeller,
    lastSaleAt: lastSaleDaysAgo == null ? null : daysAgo(lastSaleDaysAgo),
  };
}

const seedProducts: Product[] = [
  product('v-hoodie-blk-m', 'Black Hoodie', 'M', 38, 1450, 620, 3.1, true, 1),
  product('v-hoodie-blk-l', 'Black Hoodie', 'L', 14, 1450, 620, 2.4, true, 1),
  product('v-hoodie-blk-xl', 'Black Hoodie', 'XL', 9, 1450, null, 1.1, false, 2),
  product('v-tee-wht-m', 'Oversized Tee', 'White / M', 20, 620, 240, 4.5, false, 1),
  product('v-tee-wht-l', 'Oversized Tee', 'White / L', 60, 620, 240, 3.0, false, 1),
  product('v-tee-blk-m', 'Oversized Tee', 'Black / M', 5, 620, null, 5.0, true, 1),
  product('v-cargo-bge-32', 'Cargo Pants', 'Beige / 32', 10, 1400, 560, 0, false, 68),
  product('v-cargo-bge-34', 'Cargo Pants', 'Beige / 34', 8, 1400, 560, 0, false, 72),
  product('v-cargo-blk-32', 'Cargo Pants', 'Black / 32', 25, 1400, null, 1.4, false, 3),
  product('v-knit-crm-m', 'Knit Sweater', 'Cream / M', 30, 1650, 720, 1.8, false, 2),
  product('v-knit-crm-l', 'Knit Sweater', 'Cream / L', 22, 1650, null, 1.2, false, 4),
  product('v-denim-m', 'Denim Jacket', 'M', 16, 1900, 850, 0.9, false, 5),
  product('v-denim-l', 'Denim Jacket', 'L', 12, 1900, 850, 1.1, false, 3),
  product('v-cap-blk', 'Logo Cap', 'Black', 120, 450, 150, 2.2, false, 1),
];

// One entry has a manual cost so the "manual" vs "shopify" tag both appear.
seedProducts.find((p) => p.variantId === 'v-tee-wht-m')!.costSource = 'manual';
seedProducts.find((p) => p.variantId === 'v-denim-m')!.costSource = 'manual';

const seedAlerts: InventoryAlert[] = [
  {
    id: 'alert-hoodie-l',
    type: 'best_seller_low',
    severity: 'critical',
    title: 'Black Hoodie · L',
    body: 'Your best seller — about 6 days of stock left at this pace. Reorder before it goes dark.',
    variantId: 'v-hoodie-blk-l',
    createdAt: daysAgo(0),
  },
  {
    id: 'alert-tee-wht-m',
    type: 'low_stock',
    severity: 'warning',
    title: 'Oversized Tee · White / M',
    body: 'Running low — roughly 4 days of cover left. It moves steadily, so it is worth topping up.',
    variantId: 'v-tee-wht-m',
    createdAt: daysAgo(1),
  },
  {
    id: 'alert-cargo-bge',
    type: 'dead_stock',
    severity: 'neutral',
    title: 'Cargo Pants · Beige / 32',
    body: "Hasn't sold a unit in 68 days — EGP 14,000 sitting dead. A bundle or markdown could free that cash.",
    variantId: 'v-cargo-bge-32',
    createdAt: daysAgo(2),
  },
];

/** A single-use Telegram link code — mock until the backend endpoint lands. */
function makeMockLinkCode(): TelegramLinkCode {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const code = `IVY-${rand}`;
  return {
    code,
    deepLink: `https://t.me/KrewIvyBot?start=${code}`,
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  };
}

// ── Seed data ─────────────────────────────────────────────────────────────────
// Capitals + Expenses start EMPTY — they are hydrated from the backend on mount
// (see IvyProvider). The revenue / inventory / target seed below is dummy data
// that keeps the not-yet-wired pages populated until those endpoints land.

const initialState: IvyState = {
  capitals: [],
  expenses: [],
  revenueChannels: [
    { id: 'ch-online', brand_id: BRAND_ID, name: 'Online Store', kind: 'online', created_at: monthDate(2, 10) },
    { id: 'ch-showroom', brand_id: BRAND_ID, name: 'Zamalek Showroom', kind: 'showroom', created_at: monthDate(2, 12) },
    { id: 'ch-retail', brand_id: BRAND_ID, name: 'Retail Stockists', kind: 'retail', created_at: monthDate(1, 5) },
  ],
  revenueSnapshots: [
    // ── Online (Bosta, auto) — this month 800K gross / 224K returns → 28% ──
    snapshot(0, 6, 380_000, 108_000),
    snapshot(0, 1, 420_000, 116_000),
    // Last month — 720K gross / 180K returns → 25%
    snapshot(1, 24, 190_000, 48_000),
    snapshot(1, 17, 185_000, 46_000),
    snapshot(1, 10, 180_000, 44_000),
    snapshot(1, 3, 165_000, 42_000),
    // Two months back — inside the 90-day window
    snapshot(2, 27, 150_000, 36_000),
    snapshot(2, 20, 145_000, 35_000),
    snapshot(2, 13, 140_000, 33_000),
    snapshot(2, 6, 135_000, 32_000),
    // ── Zamalek Showroom (manual) ──
    snapshot(0, 6, 36_000, 0, 'ch-showroom', 'manual'),
    snapshot(0, 3, 48_000, 0, 'ch-showroom', 'manual'),
    snapshot(1, 25, 43_000, 0, 'ch-showroom', 'manual'),
    snapshot(1, 15, 52_000, 0, 'ch-showroom', 'manual'),
    snapshot(2, 20, 38_000, 0, 'ch-showroom', 'manual'),
    // ── Retail Stockists (manual) ──
    snapshot(0, 5, 30_000, 0, 'ch-retail', 'manual'),
    snapshot(1, 20, 42_000, 0, 'ch-retail', 'manual'),
  ],
  inventory: {
    id: 'inv-1',
    brand_id: BRAND_ID,
    inventory_value: 700_000, // 1,400 units × ~EGP 500 avg — from Shopify
    units: 1_400,
    updated_at: monthDate(0, 2),
  },
  target: {
    id: 'target-1',
    brand_id: BRAND_ID,
    sales_target: 1_000_000,
    period: 'monthly',
  },
  nudges: [
    {
      id: 'nudge-return-rate',
      severity: 'warning',
      message: 'Return rate jumped to 28% this month — up from 25% last month',
      href: '/dashboard/ivy',
    },
    {
      id: 'nudge-capital',
      severity: 'warning',
      message: '80% of Main Operating Capital is spent — EGP 100,000 remaining',
      href: '/dashboard/ivy/capital',
    },
  ],
  dismissedNudgeIds: [],
  ivyEnabled: true,
  products: seedProducts,
  alerts: seedAlerts,
  dismissedAlertIds: [],
  alertPreferences: DEFAULT_ALERT_PREFERENCES,
  onboarding: {
    hydrated: false,
    completed: false,
    telegramLinked: false,
    step: 'welcome',
    bannerDismissed: false,
  },
  telegramLinkCode: null,
};

// ── Store (pub/sub, immutable snapshots — plays well with useSyncExternalStore)

type Listener = () => void;

class IvyClient {
  private state: IvyState = initialState;
  private listeners = new Set<Listener>();
  private telegramSimTimer?: ReturnType<typeof setTimeout>;

  getState = (): IvyState => this.state;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private set(next: IvyState) {
    this.state = next;
    this.listeners.forEach((fn) => fn());
  }

  /** Replace the store from a backend bootstrap (mock → live seam).
      Only Capitals + Expenses are wired to the API; revenue/inventory/target
      keep whatever the current (seed/dummy) state holds. */
  hydrate(partial: { capitals: Capital[]; expenses: Expense[] }) {
    this.set({ ...this.state, capitals: partial.capitals, expenses: partial.expenses });
  }

  /** Swap a client temp id for the server-assigned id across the store, so
      later writes (e.g. an expense on a freshly created pool) reference the
      real DB row. */
  private swapCapitalId(tempId: string, serverRow: Capital) {
    const s = this.state;
    this.set({
      ...s,
      capitals: s.capitals.map((c) => (c.id === tempId ? { ...serverRow } : c)),
      expenses: s.expenses.map((e) => (e.capital_id === tempId ? { ...e, capital_id: serverRow.id } : e)),
    });
  }

  private swapExpenseId(tempId: string, serverRow: Expense) {
    const s = this.state;
    this.set({ ...s, expenses: s.expenses.map((e) => (e.id === tempId ? { ...serverRow } : e)) });
  }

  // ── Mutations (optimistic: local write now, API in the background) ─────────

  addExpense(input: {
    amount: number;
    category: ExpenseCategory;
    capital_id: string;
    source: ExpenseSource;
    note: string;
    spent_at: string;
  }): Expense {
    const row: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      brand_id: BRAND_ID,
      ...input,
    };
    const s = this.state;
    this.set({
      ...s,
      expenses: [row, ...s.expenses],
      capitals: s.capitals.map((c) =>
        c.id === input.capital_id ? { ...c, current_balance: c.current_balance - input.amount } : c,
      ),
    });

    createIvyExpense(input)
      .then((serverRow: Expense) => this.swapExpenseId(row.id, serverRow))
      .catch((err) => {
        console.error('[ivy] addExpense failed — reverting:', err);
        const cur = this.state;
        this.set({
          ...cur,
          expenses: cur.expenses.filter((e) => e.id !== row.id),
          capitals: cur.capitals.map((c) =>
            c.id === input.capital_id ? { ...c, current_balance: c.current_balance + input.amount } : c,
          ),
        });
      });
    return row;
  }

  addCapital(input: { name: string; initial_amount: number; color: CapitalColor }): Capital {
    const row: Capital = {
      id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      brand_id: BRAND_ID,
      name: input.name,
      initial_amount: input.initial_amount,
      current_balance: input.initial_amount,
      color: input.color,
      created_at: new Date().toISOString(),
    };
    const s = this.state;
    this.set({ ...s, capitals: [...s.capitals, row] });

    createIvyCapital(input)
      .then((serverRow: Capital) => this.swapCapitalId(row.id, serverRow))
      .catch((err) => {
        console.error('[ivy] addCapital failed — reverting:', err);
        const cur = this.state;
        this.set({ ...cur, capitals: cur.capitals.filter((c) => c.id !== row.id) });
      });
    return row;
  }

  /** Rename / recolor / re-inject a pool. Balance shifts by the change in
      injected amount so recorded spend (initial − balance) is preserved. */
  updateCapital(id: string, input: { name: string; initial_amount: number; color: CapitalColor }) {
    const s = this.state;
    const prev = s.capitals.find((c) => c.id === id);
    this.set({
      ...s,
      capitals: s.capitals.map((c) => {
        if (c.id !== id) return c;
        const spent = c.initial_amount - c.current_balance;
        return {
          ...c,
          name: input.name,
          initial_amount: input.initial_amount,
          color: input.color,
          current_balance: input.initial_amount - spent,
        };
      }),
    });

    updateIvyCapital(id, input)
      .then((serverRow: Capital) => {
        const cur = this.state;
        this.set({ ...cur, capitals: cur.capitals.map((c) => (c.id === id ? { ...serverRow } : c)) });
      })
      .catch((err) => {
        console.error('[ivy] updateCapital failed — reverting:', err);
        if (!prev) return;
        const cur = this.state;
        this.set({ ...cur, capitals: cur.capitals.map((c) => (c.id === id ? prev : c)) });
      });
  }

  /** Delete a pool. Guarded by the caller — pools with deductions can't be
      deleted (their expenses reference this capital_id). */
  deleteCapital(id: string) {
    const s = this.state;
    const removed = s.capitals.find((c) => c.id === id);
    this.set({ ...s, capitals: s.capitals.filter((c) => c.id !== id) });

    deleteIvyCapital(id).catch((err) => {
      console.error('[ivy] deleteCapital failed — reverting:', err);
      if (!removed) return;
      const cur = this.state;
      this.set({ ...cur, capitals: [...cur.capitals, removed] });
    });
  }

  addRevenueChannel(input: { name: string; kind: RevenueChannelKind }): RevenueChannel {
    const row: RevenueChannel = {
      id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      brand_id: BRAND_ID,
      name: input.name,
      kind: input.kind,
      created_at: new Date().toISOString(),
    };
    const s = this.state;
    this.set({ ...s, revenueChannels: [...s.revenueChannels, row] });
    return row;
  }

  /** Manual revenue entry — showroom payouts, retail settlements, etc.
      Flows into net revenue / net profit everywhere, exactly like Bosta rows. */
  addRevenueEntry(input: { channel_id: string; date: string; gross: number; returns: number }): RevenueSnapshot {
    const row: RevenueSnapshot = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      brand_id: BRAND_ID,
      channel_id: input.channel_id,
      date: input.date,
      gross_delivered: input.gross,
      returns: input.returns,
      net_revenue: input.gross - input.returns,
      source: 'manual',
    };
    const s = this.state;
    this.set({ ...s, revenueSnapshots: [row, ...s.revenueSnapshots] });
    return row;
  }

  dismissNudge(id: string) {
    const s = this.state;
    if (s.dismissedNudgeIds.includes(id)) return;
    this.set({ ...s, dismissedNudgeIds: [...s.dismissedNudgeIds, id] });
  }

  toggleIvyEnabled() {
    const s = this.state;
    this.set({ ...s, ivyEnabled: !s.ivyEnabled });
  }

  // ── Inventory: per-variant cost editing ────────────────────────────────────
  // These four surfaces write to endpoints that don't exist yet, so they keep
  // the optimistic local write and only log on failure (no revert — the local
  // store is the source of truth until the backend lands).

  /** Set (or clear, with null) a variant's unit cost. Manual entries tag as such. */
  setProductCost(variantId: string, unitCost: number | null) {
    const s = this.state;
    this.set({
      ...s,
      products: s.products.map((p) =>
        p.variantId === variantId
          ? { ...p, unitCost, costSource: unitCost == null ? null : 'manual' }
          : p,
      ),
    });
    if (unitCost != null) {
      updateIvyProductCost(variantId, unitCost).catch(() => {
        /* TODO: revert once the endpoint is live */
      });
    }
  }

  dismissAlert(id: string) {
    const s = this.state;
    if (s.dismissedAlertIds.includes(id)) return;
    this.set({ ...s, dismissedAlertIds: [...s.dismissedAlertIds, id] });
    dismissIvyAlert(id).catch(() => {});
  }

  updateAlertPreferences(next: AlertPreferences) {
    this.set({ ...this.state, alertPreferences: next });
    updateIvyAlertPreferences(next).catch(() => {});
  }

  // ── First-open onboarding ──────────────────────────────────────────────────

  private persistOnboarding() {
    if (typeof window === 'undefined') return;
    const { completed, telegramLinked, step, bannerDismissed } = this.state.onboarding;
    try {
      window.localStorage.setItem(
        'ivy_onboarding_v1',
        JSON.stringify({ completed, telegramLinked, step, bannerDismissed }),
      );
    } catch {
      /* storage blocked — flow still works in-session */
    }
  }

  /** Called once on the client (IvyProvider) to restore saved progress. */
  hydrateOnboarding() {
    if (typeof window === 'undefined') return;
    let saved: Partial<IvyState['onboarding']> = {};
    try {
      const raw = window.localStorage.getItem('ivy_onboarding_v1');
      if (raw) saved = JSON.parse(raw);
    } catch {
      /* ignore corrupt storage */
    }
    this.set({
      ...this.state,
      onboarding: { ...this.state.onboarding, ...saved, hydrated: true },
    });
  }

  setOnboardingStep(step: OnboardingStep) {
    this.set({ ...this.state, onboarding: { ...this.state.onboarding, step } });
    this.persistOnboarding();
  }

  markTelegramLinked() {
    if (this.state.onboarding.telegramLinked) return;
    this.set({ ...this.state, onboarding: { ...this.state.onboarding, telegramLinked: true } });
    this.persistOnboarding();
  }

  dismissOnboardingBanner() {
    this.set({ ...this.state, onboarding: { ...this.state.onboarding, bannerDismissed: true } });
    this.persistOnboarding();
  }

  /** Re-open the onboarding overlay straight at the Telegram step (from the
      Overview "connect Telegram" banner). Completing it flips completed back. */
  reopenTelegramStep() {
    this.set({
      ...this.state,
      onboarding: { ...this.state.onboarding, completed: false, step: 'telegram' },
    });
    this.persistOnboarding();
  }

  completeOnboarding() {
    this.set({
      ...this.state,
      onboarding: { ...this.state.onboarding, completed: true, step: 'done' },
    });
    this.persistOnboarding();
    completeIvyOnboarding().catch(() => {});
  }

  /** Dev helper — replays the first-open flow (see the dashboard console note). */
  resetOnboarding() {
    clearTimeout(this.telegramSimTimer);
    this.set({
      ...this.state,
      telegramLinkCode: null,
      onboarding: {
        hydrated: true,
        completed: false,
        telegramLinked: false,
        step: 'welcome',
        bannerDismissed: false,
      },
    });
    this.persistOnboarding();
  }

  /** Issue a Telegram linking code. */
  fetchTelegramLinkCode() {
    // TODO: wire to real endpoint (GET /api/ivy/telegram/link-code). A mock
    // code keeps the linking step fully demoable before the backend lands.
    this.set({ ...this.state, telegramLinkCode: makeMockLinkCode() });
  }

  /** Mock: pretend the user tapped "start" in Telegram a few seconds after they
      open the deep link, so the success state actually plays in the demo.
      TODO(backend): drop this — real confirmation comes from polling
      GET /api/ivy/onboarding/status until telegramLinked === true. */
  armTelegramLinkSimulation() {
    if (this.state.onboarding.telegramLinked) return;
    clearTimeout(this.telegramSimTimer);
    this.telegramSimTimer = setTimeout(() => this.markTelegramLinked(), 5000);
  }
}

/** Singleton — import this everywhere; never touch state another way. */
export const ivyClient = new IvyClient();

// ── Period windows ────────────────────────────────────────────────────────────

export function periodRange(period: IvyPeriod): { start: Date; end: Date } {
  const n = new Date();
  if (period === 'this_month') {
    return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: n };
  }
  if (period === 'last_month') {
    return {
      start: new Date(n.getFullYear(), n.getMonth() - 1, 1),
      end: new Date(n.getFullYear(), n.getMonth(), 0, 23, 59, 59),
    };
  }
  const start = new Date(n);
  start.setDate(start.getDate() - 90);
  return { start, end: n };
}

/** The comparison window used for trend deltas. */
function previousRange(period: IvyPeriod): { start: Date; end: Date } {
  const n = new Date();
  if (period === 'this_month') return periodRange('last_month');
  if (period === 'last_month') {
    return {
      start: new Date(n.getFullYear(), n.getMonth() - 2, 1),
      end: new Date(n.getFullYear(), n.getMonth() - 1, 0, 23, 59, 59),
    };
  }
  const end = new Date(n);
  end.setDate(end.getDate() - 90);
  const start = new Date(n);
  start.setDate(start.getDate() - 180);
  return { start, end };
}

const inRange = (iso: string, r: { start: Date; end: Date }) => {
  const t = new Date(iso).getTime();
  return t >= r.start.getTime() && t <= r.end.getTime();
};

// ── Selectors (pure — derive everything from state, never store derived data) ─

export interface PeriodMetrics {
  grossDelivered: number;
  returns: number;
  netRevenue: number;
  /** Online-channel returns / online gross, 0–100 (COD metric — manual
      showroom/retail revenue is excluded). Null when there is no online data. */
  returnRatePct: number | null;
  expensesTotal: number;
  /** net_revenue − expenses in period */
  netProfit: number;
  /** Weekly return-rate points inside the period, oldest → newest (sparkline). */
  returnRateSeries: number[];
}

function metricsForRange(state: IvyState, r: { start: Date; end: Date }): PeriodMetrics {
  const snaps = state.revenueSnapshots
    .filter((s) => inRange(s.date, r))
    .sort((a, b) => a.date.localeCompare(b.date));
  const grossDelivered = snaps.reduce((s, x) => s + x.gross_delivered, 0);
  const returns = snaps.reduce((s, x) => s + x.returns, 0);
  const netRevenue = grossDelivered - returns;
  const expensesTotal = state.expenses
    .filter((e) => inRange(e.spent_at, r))
    .reduce((s, e) => s + e.amount, 0);
  // Return rate is a COD-delivery metric — computed on ONLINE channels only so
  // showroom/retail revenue doesn't dilute it.
  const onlineIds = new Set(state.revenueChannels.filter((c) => c.kind === 'online').map((c) => c.id));
  const onlineSnaps = snaps.filter((s) => onlineIds.has(s.channel_id));
  const onlineGross = onlineSnaps.reduce((s, x) => s + x.gross_delivered, 0);
  const onlineReturns = onlineSnaps.reduce((s, x) => s + x.returns, 0);
  return {
    grossDelivered,
    returns,
    netRevenue,
    returnRatePct: onlineGross > 0 ? (onlineReturns / onlineGross) * 100 : null,
    expensesTotal,
    netProfit: netRevenue - expensesTotal,
    returnRateSeries: onlineSnaps
      .filter((s) => s.gross_delivered > 0)
      .map((s) => (s.returns / s.gross_delivered) * 100),
  };
}

export function selectPeriodMetrics(state: IvyState, period: IvyPeriod): PeriodMetrics {
  return metricsForRange(state, periodRange(period));
}

/** Same metrics for the comparison window — for “vs last period” deltas. */
export function selectPreviousMetrics(state: IvyState, period: IvyPeriod): PeriodMetrics {
  return metricsForRange(state, previousRange(period));
}

/** cash_remaining = Σ capital injected − Σ deductions. Period-independent. */
export function selectCashRemaining(state: IvyState): { injected: number; remaining: number } {
  const injected = state.capitals.reduce((s, c) => s + c.initial_amount, 0);
  const remaining = state.capitals.reduce((s, c) => s + c.current_balance, 0);
  return { injected, remaining };
}

export function selectCategoryBreakdown(
  state: IvyState,
  opts: { period?: IvyPeriod; source?: ExpenseSource | 'all' } = {},
): { category: ExpenseCategory; total: number }[] {
  const r = opts.period ? periodRange(opts.period) : null;
  const totals = new Map<ExpenseCategory, number>();
  for (const e of state.expenses) {
    if (r && !inRange(e.spent_at, r)) continue;
    if (opts.source && opts.source !== 'all' && e.source !== opts.source) continue;
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function selectExpensesForCapital(state: IvyState, capitalId: string): Expense[] {
  return state.expenses
    .filter((e) => e.capital_id === capitalId)
    .sort((a, b) => b.spent_at.localeCompare(a.spent_at));
}

export function selectActiveNudges(state: IvyState): Nudge[] {
  return state.nudges.filter((n) => !state.dismissedNudgeIds.includes(n.id));
}

/** All logged expenses, newest first — the activity feed. */
export function selectActivityFeed(state: IvyState): Expense[] {
  return [...state.expenses].sort((a, b) => b.spent_at.localeCompare(a.spent_at));
}

// ── Revenue selectors ─────────────────────────────────────────────────────────

export interface ChannelBreakdownRow {
  channel: RevenueChannel;
  gross: number;
  returns: number;
  net: number;
  /** Share of total net revenue in the period, 0–100. */
  sharePct: number;
}

export function selectChannelBreakdown(state: IvyState, period: IvyPeriod): ChannelBreakdownRow[] {
  const r = periodRange(period);
  const rows = state.revenueChannels.map((channel) => {
    const snaps = state.revenueSnapshots.filter((s) => s.channel_id === channel.id && inRange(s.date, r));
    const gross = snaps.reduce((s, x) => s + x.gross_delivered, 0);
    const returns = snaps.reduce((s, x) => s + x.returns, 0);
    return { channel, gross, returns, net: gross - returns, sharePct: 0 };
  });
  const totalNet = rows.reduce((s, x) => s + x.net, 0);
  for (const row of rows) row.sharePct = totalNet > 0 ? (row.net / totalNet) * 100 : 0;
  return rows.sort((a, b) => b.net - a.net);
}

/** Revenue entries newest first, optionally scoped to a period / channel. */
export function selectRevenueEntries(
  state: IvyState,
  opts: { period?: IvyPeriod; channelId?: string | 'all' } = {},
): RevenueSnapshot[] {
  const r = opts.period ? periodRange(opts.period) : null;
  return state.revenueSnapshots
    .filter((s) => (!r || inRange(s.date, r)) && (!opts.channelId || opts.channelId === 'all' || s.channel_id === opts.channelId))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── P&L (Reports) ─────────────────────────────────────────────────────────────

export interface PnLStatement {
  revenue: ChannelBreakdownRow[];
  grossRevenue: number;
  totalReturns: number;
  netRevenue: number;
  expenses: { category: ExpenseCategory; total: number }[];
  totalExpenses: number;
  netProfit: number;
  /** netProfit / netRevenue, 0–100. Null when there's no revenue. */
  marginPct: number | null;
}

/** The full profit & loss statement for a period — powers /reports + exports. */
export function selectPnL(state: IvyState, period: IvyPeriod): PnLStatement {
  const revenue = selectChannelBreakdown(state, period);
  const grossRevenue = revenue.reduce((s, x) => s + x.gross, 0);
  const totalReturns = revenue.reduce((s, x) => s + x.returns, 0);
  const netRevenue = grossRevenue - totalReturns;
  const expenses = selectCategoryBreakdown(state, { period });
  const totalExpenses = expenses.reduce((s, x) => s + x.total, 0);
  const netProfit = netRevenue - totalExpenses;
  return {
    revenue,
    grossRevenue,
    totalReturns,
    netRevenue,
    expenses,
    totalExpenses,
    netProfit,
    marginPct: netRevenue > 0 ? (netProfit / netRevenue) * 100 : null,
  };
}

// ── Inventory selectors ────────────────────────────────────────────────────────

export function selectInventoryProducts(state: IvyState): Product[] {
  return state.products;
}

export interface InventoryStats {
  /** Σ units × unit_cost, over products that HAVE a cost — "money locked in stock". */
  costValue: number;
  /** Σ units × selling_price, over all products — the retail sticker total. */
  retailValue: number;
  units: number;
  withCost: number;
  total: number;
  /** withCost / total, 0–100 — profit accuracy depends on this. */
  coveragePct: number;
}

export function selectInventoryStats(state: IvyState): InventoryStats {
  let costValue = 0;
  let retailValue = 0;
  let units = 0;
  let withCost = 0;
  for (const p of state.products) {
    units += p.unitsInStock;
    retailValue += p.unitsInStock * p.sellingPrice;
    if (p.unitCost != null) {
      costValue += p.unitsInStock * p.unitCost;
      withCost += 1;
    }
  }
  const total = state.products.length;
  return {
    costValue,
    retailValue,
    units,
    withCost,
    total,
    coveragePct: total > 0 ? (withCost / total) * 100 : 0,
  };
}

/** Active (non-dismissed) alerts for a scope. `inventory` drops non-stock alerts. */
export function selectInventoryAlerts(
  state: IvyState,
  scope: 'inventory' | 'all' = 'inventory',
): InventoryAlert[] {
  return state.alerts.filter((a) => {
    if (state.dismissedAlertIds.includes(a.id)) return false;
    if (scope === 'inventory' && a.type === 'return_spike') return false;
    return true;
  });
}

// ── Two-layer profit (Overview) ─────────────────────────────────────────────────

export interface CogsAndCash {
  /** Cost of goods sold in the period (mock: blended cost ratio × delivered). */
  cogs: number;
  /** Cash change in the period — negative when restock ate the profit. */
  cashDelta: number;
  costCoveragePct: number;
  /** net_revenue − COGS − operating expenses. */
  realNetProfit: number;
}

/**
 * Separates profit from cash for the Overview hero. COGS is estimated from the
 * blended cost ratio of the products that have a cost, so it sharpens as more
 * costs are filled in; with 0% coverage it is 0 and the card shows the nudge.
 * TODO(backend): replace the estimate with real per-order COGS + cash flow.
 */
export function selectCogsAndCash(state: IvyState, period: IvyPeriod): CogsAndCash {
  const metrics = selectPeriodMetrics(state, period);
  const stats = selectInventoryStats(state);

  let costBase = 0;
  let retailBase = 0;
  for (const p of state.products) {
    if (p.unitCost == null) continue;
    costBase += p.unitsInStock * p.unitCost;
    retailBase += p.unitsInStock * p.sellingPrice;
  }
  const ratio = retailBase > 0 ? costBase / retailBase : 0;
  const cogs = stats.coveragePct > 0 ? Math.round(ratio * metrics.grossDelivered) : 0;
  const realNetProfit = metrics.netRevenue - cogs - metrics.expensesTotal;

  // Cash ≠ profit: assume ~1.15× of what you sold got restocked, so cash dips
  // below profit by that extra inventory outlay. Mock — see the TODO above.
  const restock = Math.round(cogs * 1.15);
  const cashDelta = realNetProfit - restock;

  return { cogs, cashDelta, costCoveragePct: stats.coveragePct, realNetProfit };
}
