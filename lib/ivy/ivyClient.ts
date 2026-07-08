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
  Capital,
  CapitalColor,
  Expense,
  ExpenseCategory,
  ExpenseSource,
  Inventory,
  IvyPeriod,
  Nudge,
  RevenueChannel,
  RevenueChannelKind,
  RevenueSnapshot,
  Target,
} from './types';

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

function expense(
  monthOffset: number,
  day: number,
  amount: number,
  category: ExpenseCategory,
  source: ExpenseSource,
  note: string,
): Expense {
  return {
    id: sid('exp'),
    brand_id: BRAND_ID,
    amount,
    category,
    capital_id: 'cap-main',
    source,
    note,
    spent_at: monthDate(monthOffset, day),
  };
}

// ── Seed data ─────────────────────────────────────────────────────────────────
// This month: ~800K gross delivered, 28% return rate.
// Capital: 500K injected, 400K spent (80%) → 100K cash remaining.
// Inventory 700K vs 1M sales target → 300K gap.

const SEED_EXPENSES: Expense[] = [
  expense(0, 5, 40_000, 'marketing_ads', 'text', 'Meta + TikTok ads — week 1'),
  expense(0, 4, 2_000, 'other', 'voice', 'Courier tips + misc supplies'),
  expense(0, 3, 6_000, 'software', 'text', 'Shopify + tools subscriptions'),
  expense(0, 2, 60_000, 'inventory_materials', 'voice', 'Bought fabrics and zippers'),
  expense(0, 1, 15_000, 'rent_utilities', 'voice', 'Workshop rent'),
  expense(1, 28, 55_000, 'marketing_ads', 'text', 'Meta ads — full month'),
  expense(1, 27, 45_000, 'shipping_fulfillment', 'receipt', 'Bosta monthly invoice'),
  expense(1, 26, 40_000, 'salaries', 'text', 'Monthly payroll — 4 staff'),
  expense(1, 21, 5_000, 'fees_commissions', 'text', 'Payment gateway fees'),
  expense(1, 18, 12_000, 'packaging', 'receipt', 'Mailers, tissue paper, stickers'),
  expense(1, 12, 120_000, 'inventory_materials', 'receipt', 'Fabric restock — 3 suppliers'),
];

const SEED_SPENT = SEED_EXPENSES.reduce((s, e) => s + e.amount, 0); // 400,000

const initialState: IvyState = {
  capitals: [
    {
      id: 'cap-main',
      brand_id: BRAND_ID,
      name: 'Main Operating Capital',
      initial_amount: 500_000,
      current_balance: 500_000 - SEED_SPENT, // 100,000
      color: 'teal',
      created_at: monthDate(2, 10),
    },
  ],
  expenses: SEED_EXPENSES,
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
};

// ── Store (pub/sub, immutable snapshots — plays well with useSyncExternalStore)

type Listener = () => void;

class IvyClient {
  private state: IvyState = initialState;
  private listeners = new Set<Listener>();

  getState = (): IvyState => this.state;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private set(next: IvyState) {
    this.state = next;
    this.listeners.forEach((fn) => fn());
  }

  // ── Mutations (future: POST/PUT to the API, then refresh) ──────────────────

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
    return row;
  }

  /** Rename / recolor / re-inject a pool. Balance shifts by the change in
      injected amount so recorded spend (initial − balance) is preserved. */
  updateCapital(id: string, input: { name: string; initial_amount: number; color: CapitalColor }) {
    const s = this.state;
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
  }

  /** Delete a pool. Guarded by the caller — pools with deductions can't be
      deleted (their expenses reference this capital_id). */
  deleteCapital(id: string) {
    const s = this.state;
    this.set({ ...s, capitals: s.capitals.filter((c) => c.id !== id) });
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
