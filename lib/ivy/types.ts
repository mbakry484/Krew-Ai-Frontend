// =============================================================================
// IVY — FINANCIAL VISIBILITY · data types
// =============================================================================
// These types mirror the future Supabase schema EXACTLY (table → interface,
// column → field). Do not add UI-only fields here — derived/presentation data
// belongs in selectors inside lib/ivy/ivyClient.ts.
//
//   capitals(id, brand_id, name, initial_amount, current_balance, color, created_at)
//   expenses(id, brand_id, amount, category, capital_id, source, note, spent_at)
//   revenue_channels(id, brand_id, name, kind, created_at)
//   revenue_snapshots(id, brand_id, channel_id, date, gross_delivered, returns, net_revenue, source)
//   inventory(id, brand_id, inventory_value, units, updated_at)
//   targets(id, brand_id, sales_target, period)
// =============================================================================

/** Fixed category enum — matches the `expenses.category` check constraint. */
export const EXPENSE_CATEGORIES = [
  'inventory_materials',
  'marketing_ads',
  'shipping_fulfillment',
  'salaries',
  'packaging',
  'software',
  'rent_utilities',
  'fees_commissions',
  'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  inventory_materials: 'Inventory & Materials',
  marketing_ads: 'Marketing & Ads',
  shipping_fulfillment: 'Shipping & Fulfillment',
  salaries: 'Salaries',
  packaging: 'Packaging',
  software: 'Software',
  rent_utilities: 'Rent & Utilities',
  fees_commissions: 'Fees & Commissions',
  other: 'Other',
};

/** How the expense entered the system (Telegram agent modality or manual). */
export const EXPENSE_SOURCES = ['text', 'voice', 'receipt'] as const;
export type ExpenseSource = (typeof EXPENSE_SOURCES)[number];

export const EXPENSE_SOURCE_LABEL: Record<ExpenseSource, string> = {
  text: 'Text',
  voice: 'Voice',
  receipt: 'Receipt',
};

/** Card colorway for a capital pool — lets users tell pools apart at a glance.
    Stored as the enum key; the gradient/label map lives with the card UI. */
export const CAPITAL_COLORS = ['teal', 'obsidian', 'silver', 'copper', 'indigo', 'rose'] as const;
export type CapitalColor = (typeof CAPITAL_COLORS)[number];

// ── Table rows ────────────────────────────────────────────────────────────────

export interface Capital {
  id: string;
  brand_id: string;
  name: string;
  initial_amount: number;
  current_balance: number;
  color: CapitalColor;
  created_at: string; // ISO
}

export interface Expense {
  id: string;
  brand_id: string;
  amount: number;
  category: ExpenseCategory;
  capital_id: string;
  source: ExpenseSource;
  note: string;
  spent_at: string; // ISO
}

/** Where revenue comes from — brands sell beyond their own site: showrooms,
    retail stockists, wholesale, pop-ups. Online channels are fed automatically
    (Bosta/Shopify later); the rest are logged manually on the Revenue page. */
export const REVENUE_CHANNEL_KINDS = ['online', 'showroom', 'retail', 'wholesale', 'popup', 'other'] as const;
export type RevenueChannelKind = (typeof REVENUE_CHANNEL_KINDS)[number];

export const REVENUE_CHANNEL_KIND_LABEL: Record<RevenueChannelKind, string> = {
  online: 'Online',
  showroom: 'Showroom',
  retail: 'Retail store',
  wholesale: 'Wholesale',
  popup: 'Pop-up',
  other: 'Other',
};

export interface RevenueChannel {
  id: string;
  brand_id: string;
  name: string;
  kind: RevenueChannelKind;
  created_at: string; // ISO
}

export interface RevenueSnapshot {
  id: string;
  brand_id: string;
  channel_id: string;
  date: string; // ISO (period-ending date of the snapshot)
  gross_delivered: number;
  returns: number;
  net_revenue: number; // gross_delivered − returns
  source: string; // 'bosta' (auto) | 'manual'
}

export interface Inventory {
  id: string;
  brand_id: string;
  // Both fields are computed from Shopify (Σ units in stock × their prices) and
  // are read-only in the UI — inventory_value = units × avg unit price.
  inventory_value: number;
  units: number;
  updated_at: string; // ISO
}

export interface Target {
  id: string;
  brand_id: string;
  sales_target: number;
  period: string; // e.g. 'monthly'
}

// ── Client-side only (not Supabase tables) ───────────────────────────────────

/** Reporting window for the overview period selector. */
export type IvyPeriod = 'this_month' | 'last_month' | 'last_90';

export const IVY_PERIOD_LABEL: Record<IvyPeriod, string> = {
  this_month: 'This month',
  last_month: 'Last month',
  last_90: 'Last 90 days',
};

/** Dismissible overview alert. Dismissed state lives in client state only. */
export interface Nudge {
  id: string;
  severity: 'warning' | 'info';
  message: string;
  href?: string;
}

// ── Inventory products (Shopify sync read-model) ──────────────────────────────
// NOT a raw Supabase table: the product/variant view returned by
//   GET /api/ivy/inventory/products
// Shopify stock joined with Ivy's per-variant cost + computed sales signals
// (velocity, days-of-stock, best-seller flag). unitCost is the ONE piece a
// founder fills in — the whole COGS/real-profit model hinges on it.

/** Where a variant's cost came from — synced from Shopify or typed by hand. */
export type CostSource = 'shopify' | 'manual';

export interface Product {
  variantId: string;
  productTitle: string;
  variantTitle: string;
  imageUrl: string | null;
  unitsInStock: number;
  sellingPrice: number;
  /** null until a cost is entered. Missing costs are the coverage nudge engine. */
  unitCost: number | null;
  costSource: CostSource | null;
  /** Units sold per day, averaged over the last 30 days. */
  velocity30d: number;
  /** unitsInStock ÷ velocity30d; null renders as "∞" (no recent sales). */
  daysOfStock: number | null;
  isBestSeller: boolean;
  lastSaleAt: string | null; // ISO
}

// ── Inventory alerts ──────────────────────────────────────────────────────────
// GET /api/ivy/alerts?scope=inventory|all → InventoryAlert[]
// severity maps to the dashboard's existing status palette (no new colors):
//   critical → #e07070 (selling out) · warning → teal accent (low) ·
//   neutral  → text-tertiary gray (dead stock).

export type AlertSeverity = 'critical' | 'warning' | 'neutral';

export type InventoryAlertType =
  | 'best_seller_low'
  | 'selling_out'
  | 'low_stock'
  | 'dead_stock'
  | 'return_spike';

export interface InventoryAlert {
  id: string;
  type: InventoryAlertType;
  severity: AlertSeverity;
  title: string;
  body: string;
  variantId?: string;
  createdAt: string; // ISO
}

// ── Alert preferences ─────────────────────────────────────────────────────────
// GET / PATCH /api/ivy/alert-preferences — same shape both ways.

export interface AlertThresholdDays {
  enabled: boolean;
  thresholdDays: number;
}

export interface AlertPreferences {
  bestSellerLowStock: AlertThresholdDays;
  anyLowStock: AlertThresholdDays;
  deadStock: AlertThresholdDays;
  returnRateSpike: { enabled: boolean; thresholdPts: number };
  poolLow: { enabled: boolean; thresholdEgp: number };
}

/** Sensible defaults from TASK 3 — used to seed the store and reset. */
export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  bestSellerLowStock: { enabled: true, thresholdDays: 7 },
  anyLowStock: { enabled: true, thresholdDays: 5 },
  deadStock: { enabled: true, thresholdDays: 60 },
  returnRateSpike: { enabled: true, thresholdPts: 5 },
  poolLow: { enabled: true, thresholdEgp: 20_000 },
};

// ── Onboarding + Telegram linking (first-open flow) ───────────────────────────
// GET  /api/ivy/onboarding/status → OnboardingStatus
// POST /api/ivy/onboarding/complete
// GET  /api/ivy/telegram/link-code → TelegramLinkCode

export interface OnboardingStatus {
  completed: boolean;
  telegramLinked: boolean;
  poolCount: number;
}

/** The four cinematic steps, in order. Progress persists across refresh. */
export type OnboardingStep = 'welcome' | 'pools' | 'telegram' | 'done';

export const ONBOARDING_STEP_ORDER: OnboardingStep[] = ['welcome', 'pools', 'telegram', 'done'];

export interface TelegramLinkCode {
  /** Shown large, e.g. "IVY-7Q2K". */
  code: string;
  /** t.me deep link the "open Telegram" button points at. */
  deepLink: string;
  expiresAt: string; // ISO
}
