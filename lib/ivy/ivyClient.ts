// =============================================================================
// IVY — FINANCIAL VISIBILITY · data client (THE single data seam)
// =============================================================================
// This module is the ONLY data access point for the Ivy dashboard.
//
// LIVE: capitals + expenses (bootstrap), inventory products, alerts, alert
// preferences, onboarding status (DB-backed — survives cleared storage),
// Telegram link codes, and the real P&L overview (COGS / cash delta / cost
// coverage) — all hydrated from the backend on mount (see IvyProvider →
// hydrate + hydrateIntelligence + hydrateOnboarding).
// STILL SEEDED: revenue channels/snapshots and the single inventory/target
// rows — their endpoints don't exist yet (dummy shapes keep pages rendering).
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
  BostaStatus,
  BostaUnmatchedDelivery,
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
  connectBosta as apiConnectBosta,
  createIvyCapital,
  createIvyExpense,
  deleteIvyCapital,
  disconnectBosta as apiDisconnectBosta,
  dismissIvyAlert,
  getBostaStatus,
  getBostaUnmatched,
  getIvyAlertPreferences,
  getIvyAlerts,
  getIvyInventoryProducts,
  getIvyOnboardingStatus,
  getIvyOverview,
  getIvyTelegramLinkCode,
  updateIvyAlertPreferences,
  updateIvyCapital,
  updateIvyProductCost,
} from '@/lib/api';
import type { IvyOverview } from '@/lib/api';

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
  /** Server-computed P&L per period (real COGS / cash delta / coverage).
      Absent keys → selectCogsAndCash falls back to the client estimate. */
  overviews: Partial<Record<IvyPeriod, IvyOverview>>;
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
  /** null = never connected. Drives the Online Store channel + Settings row. */
  bostaStatus: BostaStatus | null;
  /** Overview "connect Bosta" banner dismissed for this session/brand. */
  bostaBannerDismissed: boolean;
  /** false until localStorage is read on the client (prevents flash), same
      reasoning as onboarding.hydrated. */
  bostaBannerHydrated: boolean;
  /** Deliveries Bosta couldn't match to a Shopify order, per period. */
  bostaUnmatched: Partial<Record<IvyPeriod, BostaUnmatchedDelivery[]>>;
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

// ── Seed data ─────────────────────────────────────────────────────────────────
// Capitals, expenses, products, alerts, preferences, and overviews start EMPTY
// — they are hydrated from the backend on mount (see IvyProvider). Only the
// revenue / inventory / target seed below is dummy data, kept so the
// not-yet-wired revenue pages stay populated until those endpoints land.

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
  // Real warnings now come from the backend alert engine (`alerts`); the nudge
  // strip stays empty rather than asserting numbers that aren't real.
  nudges: [],
  dismissedNudgeIds: [],
  ivyEnabled: true,
  products: [],
  alerts: [],
  dismissedAlertIds: [],
  alertPreferences: DEFAULT_ALERT_PREFERENCES,
  overviews: {},
  onboarding: {
    hydrated: false,
    completed: false,
    telegramLinked: false,
    step: 'welcome',
    bannerDismissed: false,
  },
  telegramLinkCode: null,
  bostaStatus: null,
  bostaBannerDismissed: false,
  bostaBannerHydrated: false,
  bostaUnmatched: {},
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
      Capitals + Expenses come from GET /ivy; revenue/inventory/target
      keep whatever the current (seed/dummy) state holds. */
  hydrate(partial: { capitals: Capital[]; expenses: Expense[] }) {
    this.set({ ...this.state, capitals: partial.capitals, expenses: partial.expenses });
  }

  /** Pull the live profit/inventory layer: products, alerts, preferences,
      onboarding status, and the real P&L overview for every period the
      selector can ask for. Each fetch fails soft — one bad endpoint logs and
      leaves that slice as-is instead of blanking the dashboard. */
  async hydrateIntelligence() {
    const [products, alerts, prefs, onboarding, ovThis, ovLast, ov90, bostaStatus, unThis, unLast, un90] =
      await Promise.allSettled([
        getIvyInventoryProducts(),
        getIvyAlerts('all'),
        getIvyAlertPreferences(),
        getIvyOnboardingStatus(),
        getIvyOverview('this_month'),
        getIvyOverview('last_month'),
        getIvyOverview('last_90'),
        getBostaStatus(),
        getBostaUnmatched('this_month'),
        getBostaUnmatched('last_month'),
        getBostaUnmatched('last_90'),
      ]);

    // Read state AFTER the fetches so optimistic writes made meanwhile survive.
    const s = this.state;
    const next: IvyState = { ...s };

    if (products.status === 'fulfilled' && Array.isArray(products.value)) next.products = products.value;
    else if (products.status === 'rejected') console.error('[ivy] products load failed:', products.reason);

    if (alerts.status === 'fulfilled' && Array.isArray(alerts.value)) next.alerts = alerts.value;
    else if (alerts.status === 'rejected') console.error('[ivy] alerts load failed:', alerts.reason);

    if (prefs.status === 'fulfilled' && prefs.value) next.alertPreferences = prefs.value;

    if (onboarding.status === 'fulfilled' && onboarding.value) {
      // Server truth can only move these FORWARD (a completed/linked flag from
      // the DB beats stale localStorage); step + banner stay purely local.
      next.onboarding = {
        ...s.onboarding,
        completed: s.onboarding.completed || onboarding.value.completed === true,
        telegramLinked: s.onboarding.telegramLinked || onboarding.value.telegramLinked === true,
      };
    }

    const overviews: IvyState['overviews'] = { ...s.overviews };
    if (ovThis.status === 'fulfilled' && ovThis.value) overviews.this_month = ovThis.value;
    if (ovLast.status === 'fulfilled' && ovLast.value) overviews.last_month = ovLast.value;
    if (ov90.status === 'fulfilled' && ov90.value) overviews.last_90 = ov90.value;
    next.overviews = overviews;

    if (bostaStatus.status === 'fulfilled' && bostaStatus.value) next.bostaStatus = bostaStatus.value;
    else if (bostaStatus.status === 'rejected') console.error('[ivy] bosta status load failed:', bostaStatus.reason);

    const bostaUnmatched: IvyState['bostaUnmatched'] = { ...s.bostaUnmatched };
    if (unThis.status === 'fulfilled' && Array.isArray(unThis.value)) bostaUnmatched.this_month = unThis.value;
    if (unLast.status === 'fulfilled' && Array.isArray(unLast.value)) bostaUnmatched.last_month = unLast.value;
    if (un90.status === 'fulfilled' && Array.isArray(un90.value)) bostaUnmatched.last_90 = un90.value;
    next.bostaUnmatched = bostaUnmatched;

    this.set(next);
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

  /** Set a variant's unit cost (appends a manual cost row server-side; manual
      always wins over Shopify syncs). Optimistic — reverts on API failure.
      Clearing (null) is local-only: the backend cost history is append-only. */
  setProductCost(variantId: string, unitCost: number | null) {
    const s = this.state;
    const prev = s.products.find((p) => p.variantId === variantId);
    this.set({
      ...s,
      products: s.products.map((p) =>
        p.variantId === variantId
          ? { ...p, unitCost, costSource: unitCost == null ? null : 'manual' }
          : p,
      ),
    });
    if (unitCost != null) {
      updateIvyProductCost(variantId, unitCost).catch((err) => {
        console.error('[ivy] setProductCost failed — reverting:', err);
        if (!prev) return;
        const cur = this.state;
        this.set({
          ...cur,
          products: cur.products.map((p) => (p.variantId === variantId ? prev : p)),
        });
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

  // ── Bosta integration ────────────────────────────────────────────────────
  // connectBosta is deliberately NOT optimistic — the backend verifies the key
  // against Bosta before saving, and the calling UI (onboarding step, Settings
  // modal) shows a "Verifying…" state and needs the real pass/fail result to
  // show success vs. an inline error. Every other Bosta write follows the
  // usual optimistic-write-with-revert pattern.

  /** Verify + save a Bosta API key. Resolves on success (and updates
      bostaStatus); rejects on failure so the caller can show Bosta's own
      error message inline and let the founder retry. */
  async connectBosta(apiKey: string): Promise<void> {
    const res = await apiConnectBosta(apiKey);
    this.set({
      ...this.state,
      bostaStatus: {
        connectionStatus: res.status,
        connectionError: null,
        lastPollAt: new Date().toISOString(),
        historicalSyncCompletedAt: null,
      },
    });
  }

  /** Disconnect Bosta. Optimistic — reverts to the previous status if the
      backend call fails. */
  disconnectBosta() {
    const s = this.state;
    const prev = s.bostaStatus;
    this.set({ ...s, bostaStatus: null });
    apiDisconnectBosta().catch((err) => {
      console.error('[ivy] disconnectBosta failed — reverting:', err);
      this.set({ ...this.state, bostaStatus: prev });
    });
  }

  private persistBostaBanner() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        'ivy_bosta_banner_v1',
        JSON.stringify({ dismissed: this.state.bostaBannerDismissed }),
      );
    } catch {
      /* storage blocked — banner still works in-session */
    }
  }

  /** Called once on the client (IvyProvider) to restore the dismissed flag.
      No backend call — unlike onboarding this has no DB-backed truth, so it's
      a synchronous local read (kept behind a hydrated flag to avoid a flash,
      same reasoning as onboarding.hydrated). */
  hydrateBostaBanner() {
    if (typeof window === 'undefined') return;
    let dismissed = false;
    try {
      const raw = window.localStorage.getItem('ivy_bosta_banner_v1');
      if (raw) dismissed = JSON.parse(raw).dismissed === true;
    } catch {
      /* ignore corrupt storage */
    }
    this.set({ ...this.state, bostaBannerDismissed: dismissed, bostaBannerHydrated: true });
  }

  dismissBostaBanner() {
    this.set({ ...this.state, bostaBannerDismissed: true, bostaBannerHydrated: true });
    this.persistBostaBanner();
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

  /** Called once on the client (IvyProvider) to restore saved progress.
      The DATABASE (brands.ivy_onboarding_completed) is the source of truth for
      `completed` — localStorage is only a fast path + mid-flow step cache. So a
      user who clears their cookies/storage NEVER sees onboarding twice: the
      overlay stays closed (hydrated=false) until the server status resolves. */
  async hydrateOnboarding() {
    if (typeof window === 'undefined') return;
    let saved: Partial<IvyState['onboarding']> = {};
    try {
      const raw = window.localStorage.getItem('ivy_onboarding_v1');
      if (raw) saved = JSON.parse(raw);
    } catch {
      /* ignore corrupt storage */
    }

    // Fast path: storage already says done — open the dashboard immediately,
    // no network wait, no flash. (The DB flag was set when they finished.)
    if (saved.completed === true) {
      this.set({
        ...this.state,
        onboarding: { ...this.state.onboarding, ...saved, hydrated: true },
      });
      return;
    }

    // Storage says not-completed (or was cleared) — ask the backend before
    // letting the overlay open. Server flags only ever move things forward.
    let serverCompleted = false;
    let serverLinked = false;
    try {
      const status = await getIvyOnboardingStatus();
      serverCompleted = status?.completed === true;
      serverLinked = status?.telegramLinked === true;
    } catch (err) {
      // Backend unreachable — fall back to storage so a genuinely new user
      // (offline dev, cold start) still gets the flow instead of a dead end.
      console.error('[ivy] onboarding status check failed:', err);
    }

    this.set({
      ...this.state,
      onboarding: {
        ...this.state.onboarding,
        ...saved,
        // saved.completed can't be true here (fast path returned above), so
        // the server flag alone decides.
        completed: serverCompleted,
        telegramLinked: serverLinked || saved.telegramLinked === true,
        hydrated: true,
      },
    });
    if (serverCompleted) this.persistOnboarding(); // re-seed the fast path
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
    // The DB flag is what stops onboarding from ever replaying (storage can be
    // cleared), so don't let one transient failure lose it — retry once.
    completeIvyOnboarding().catch(() => {
      setTimeout(() => {
        completeIvyOnboarding().catch((err) =>
          console.error('[ivy] failed to persist onboarding completion:', err),
        );
      }, 3_000);
    });
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

  /** Issue a single-use Telegram deep link from the backend (10-minute TTL).
      Kept sync-looking for callers: the code lands in state when it arrives. */
  fetchTelegramLinkCode() {
    getIvyTelegramLinkCode()
      .then((code: TelegramLinkCode) => {
        if (code?.deepLink) this.set({ ...this.state, telegramLinkCode: code });
      })
      .catch((err) => console.error('[ivy] link-code fetch failed:', err));
  }

  /** Watch for the user completing the link in Telegram: poll onboarding
      status every 3s (up to 2 minutes) until telegramLinked flips true.
      Armed when they open the deep link. (Name kept from the mock era so the
      onboarding component didn't have to change.) */
  armTelegramLinkSimulation() {
    if (this.state.onboarding.telegramLinked) return;
    clearTimeout(this.telegramSimTimer);
    const startedAt = Date.now();
    const poll = async () => {
      if (this.state.onboarding.telegramLinked) return;
      try {
        const status = await getIvyOnboardingStatus();
        if (status?.telegramLinked) {
          this.markTelegramLinked();
          return;
        }
      } catch {
        /* transient network error — keep polling until the window closes */
      }
      if (Date.now() - startedAt < 120_000) {
        this.telegramSimTimer = setTimeout(poll, 3_000);
      }
    };
    this.telegramSimTimer = setTimeout(poll, 3_000);
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
  /** 'bosta' = the online channel (Bosta-fed by design, live once connected);
      'seed' = showroom/retail/etc — manual channels not yet built. */
  source: 'bosta' | 'seed';
}

export function selectChannelBreakdown(state: IvyState, period: IvyPeriod): ChannelBreakdownRow[] {
  const r = periodRange(period);
  const rows = state.revenueChannels.map((channel) => {
    const snaps = state.revenueSnapshots.filter((s) => s.channel_id === channel.id && inRange(s.date, r));
    const gross = snaps.reduce((s, x) => s + x.gross_delivered, 0);
    const returns = snaps.reduce((s, x) => s + x.returns, 0);
    const source: ChannelBreakdownRow['source'] = channel.kind === 'online' ? 'bosta' : 'seed';
    return { channel, gross, returns, net: gross - returns, sharePct: 0, source };
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

// ── Bosta selectors ────────────────────────────────────────────────────────────

export function selectBostaConnected(state: IvyState): boolean {
  return state.bostaStatus?.connectionStatus === 'active';
}

/** Persistent "connect/reconnect Bosta" banner on Overview — shows once
    onboarding is complete and Bosta isn't actively connected, until
    dismissed. Reappears if connectionStatus later drops out of 'active'. */
export function selectShowBostaBanner(state: IvyState): boolean {
  return (
    state.bostaBannerHydrated &&
    state.onboarding.completed &&
    !state.bostaBannerDismissed &&
    state.bostaStatus?.connectionStatus !== 'active'
  );
}

export function selectBostaUnmatched(state: IvyState, period: IvyPeriod): BostaUnmatchedDelivery[] {
  return state.bostaUnmatched[period] ?? [];
}

export function selectBostaUnmatchedCount(state: IvyState, period: IvyPeriod): number {
  return selectBostaUnmatched(state, period).length;
}

// ── Two-layer profit (Overview) ─────────────────────────────────────────────────

export interface CogsAndCash {
  /** Cost of goods sold in the period (server: Σ per-order qty × unit cost). */
  cogs: number;
  /** Cash change in the period — negative when restock ate the profit. */
  cashDelta: number;
  costCoveragePct: number;
  /** net_revenue − COGS − operating expenses. */
  realNetProfit: number;
}

/**
 * Separates profit from cash for the Overview hero.
 * Live path: the backend's `ivy_profit_summary` (per-order COGS booked at
 * delivery time + the pool cash ledger), hydrated per period on mount.
 * Until that lands (loading / offline), falls back to a client estimate:
 * blended cost ratio × delivered, restock assumed at ~1.15× of COGS.
 */
export function selectCogsAndCash(state: IvyState, period: IvyPeriod): CogsAndCash {
  const live = state.overviews[period];
  if (live) {
    return {
      cogs: live.cogsThisMonth,
      cashDelta: live.cashDeltaThisMonth,
      costCoveragePct: live.costCoveragePct,
      realNetProfit: live.realNetProfit,
    };
  }

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
  const restock = Math.round(cogs * 1.15);
  const cashDelta = realNetProfit - restock;

  return { cogs, cashDelta, costCoveragePct: stats.coveragePct, realNetProfit };
}
