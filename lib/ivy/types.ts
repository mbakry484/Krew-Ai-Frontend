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
