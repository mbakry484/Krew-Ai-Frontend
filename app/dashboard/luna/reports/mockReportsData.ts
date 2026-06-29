// ─────────────────────────────────────────────────────────────────────────────
// mockReportsData.ts
//
// Single source of truth for the Reports page while the data layer is still
// frontend-only. Every object here is shaped EXACTLY like the eventual real
// Supabase aggregation output, so going live is a one-file swap: replace
// `getReportsData(range)` with a server fetch that returns the same shape.
//
// IMPORTANT: nothing here calls an LLM. Sentiment + intent are ALREADY produced
// upstream in the async post-conversation analysis and stored. Reports only
// READS aggregates — `GROUP BY` / `COUNT` / `AVG` over rows that already exist.
// Marginal token cost of this page ≈ 0. Each field is annotated with the future
// Supabase aggregation that will fill it via a `// SOURCE:` comment.
// ─────────────────────────────────────────────────────────────────────────────

export type TimeRange = 'today' | '7d' | '30d';

/** A signed metric with its previous-period delta. `lowerIsBetter` flips the
 *  green/red colour logic (e.g. resolution time — faster is good). */
export interface Metric {
  value: number;
  /** Percentage change vs. the previous equivalent period. */
  deltaPct: number;
  lowerIsBetter?: boolean;
}

/** One mock conversation row shown inside a drill-down panel. */
export interface DrillRow {
  id: string;
  customer: string;      // @handle
  startedAt: string;     // ISO
  summary: string;
  intent: 'order' | 'exchange' | 'refund' | 'faq';
  sentiment: 'happy' | 'neutral' | 'frustrated';
  value?: number;        // EGP, when commercially relevant
  durationSec?: number;  // full time-to-resolution
}

export interface RankedItem {
  label: string;
  count: number;
}

export interface KnowledgeGap {
  id: string;
  query: string;
  count: number;          // how many times asked unanswered
  intentScore: number;    // 0–1, how purchase-adjacent the query is
}

export interface RecurringCluster {
  label: string;
  count: number;
  trend: 'up' | 'down' | 'flat';
  changePct: number;
}

export interface TrendSeries {
  name: string;
  color: string;
  values: number[];
}

export interface TrendBlock {
  labels: string[];       // x-axis buckets (hours / days / weeks)
  series: TrendSeries[];
}

export interface HeatmapBlock {
  days: string[];         // y-axis
  buckets: string[];      // x-axis hour ranges
  grid: number[][];       // grid[day][bucket] = DM count
}

export interface ReportsData {
  range: TimeRange;
  rangeLabel: string;

  // ── Row 1 — hero stat cards ───────────────────────────────────────────────
  hero: {
    // SOURCE: SUM(orders.total_price) WHERE orders.created_via='luna_dm' GROUP BY brand, period
    lunaRevenue: Metric & { orderCount: number };
    // SOURCE: COUNT(convos WHERE resolution_status='resolved') / COUNT(convos) over period
    resolutionRate: Metric & { resolvedByLuna: number; escalated: number; abandoned: number };
    // SOURCE: AVG(conversations.resolved_at - conversations.started_at) over resolved convos
    avgTimeToResolutionSec: Metric;
    // SOURCE: COUNT(convos flagged intent_shift 'refund'->'exchange') / COUNT(refund-intent convos)
    refundDeflectionRate: Metric;
  };

  // ── Row 2 — commercial impact ─────────────────────────────────────────────
  commercial: {
    // SOURCE: COUNT + SUM(orders.total_price) WHERE created_via='luna_dm'
    ordersByLuna: { count: number; totalValue: number };
    // SOURCE: COUNT + SUM(exchange_events.retained_value) WHERE processed_by='luna'
    exchangesProcessed: { count: number; valueRetained: number };
    // SOURCE: COUNT + SUM(refund_events.amount) WHERE processed_by='luna'
    refundsProcessed: { count: number; valueLost: number };
    // SOURCE: deflection_rate + SUM(order value of deflected exchanges) — needs the
    //         flow-detector 'refund'->'exchange' intent-shift event to exist.
    refundDeflection: { deflectionPct: number; revenueSaved: number };
  };

  // ── Row 3 — resolution quality ────────────────────────────────────────────
  quality: {
    // SOURCE: resolution_rate GROUP BY intent_type (intent already stored per convo)
    resolutionByIntent: { intent: 'order' | 'exchange' | 'refund' | 'faq'; rate: number }[];
    // SOURCE: AVG(messages_to_resolution) bucketed over the period (trend = per-bucket avg)
    avgMessagesToResolution: { value: number; trend: number[] };
    // SOURCE: top-N conversations ORDER BY (resolved_at - started_at) DESC
    slowestConversations: DrillRow[];
  };

  // ── Row 4 — issues & sentiment as TRENDS (change over time) ────────────────
  trends: {
    // SOURCE: COUNT(issues) GROUP BY category, time_bucket (stored issue categories)
    issueCategories: TrendBlock;
    // SOURCE: sentiment distribution GROUP BY time_bucket (stored sentiment per convo)
    sentiment: TrendBlock & { summary: string };
    // SOURCE: clustered recurring complaints w/ period-over-period delta
    recurringClusters: RecurringCluster[];
  };

  // ── Row 5 — customer & demand signals ─────────────────────────────────────
  demand: {
    // SOURCE: COUNT(convos) GROUP BY detected_intent ORDER BY count DESC
    topQuestions: RankedItem[];
    // SOURCE: COUNT(product_mentions) GROUP BY product_id (product similarity search)
    topProducts: RankedItem[];
    // SOURCE: COUNT(messages) GROUP BY day_of_week, hour_bucket
    peakHours: HeatmapBlock;
    // SOURCE: unanswered high-intent queries (no KB match) GROUP BY normalized_query
    knowledgeGaps: KnowledgeGap[];
  };

  // ── Drill-downs — mock conversation rows behind each hero card ─────────────
  // SOURCE: filtered conversation list for the metric the user clicked into.
  drilldowns: Record<string, DrillRow[]>;
}

// ─── Heatmap helpers (deterministic, believable shape) ────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BUCKETS = ['0–4', '4–8', '8–12', '12–16', '16–20', '20–24'];

function makeGrid(scale: number): number[][] {
  // Evenings (16–24) and Thu–Sat skew hot — mirrors MENA DM behaviour.
  const base = [
    [1, 0, 2, 3, 5, 4],
    [1, 1, 3, 4, 6, 5],
    [1, 1, 3, 5, 7, 6],
    [2, 1, 4, 6, 8, 7],
    [2, 2, 5, 7, 9, 9],
    [3, 2, 6, 8, 9, 8],
    [2, 1, 4, 6, 7, 6],
  ];
  return base.map((row) => row.map((v) => Math.round(v * scale)));
}

// ─── Sample conversation rows reused across drill-downs ───────────────────────
function rows(): DrillRow[] {
  return [
    { id: 'c1', customer: '@sara.mostafa', startedAt: '2026-06-27T19:12:00Z', summary: 'Ordered the black hoodie size M via DM, paid COD.', intent: 'order', sentiment: 'happy', value: 1450, durationSec: 540 },
    { id: 'c2', customer: '@karimt', startedAt: '2026-06-27T16:40:00Z', summary: 'Wanted a refund on the jacket — Luna offered an exchange instead.', intent: 'exchange', sentiment: 'neutral', value: 2100, durationSec: 1820 },
    { id: 'c3', customer: '@noura.a', startedAt: '2026-06-26T21:05:00Z', summary: 'Asked about restock dates for the cargo trousers.', intent: 'faq', sentiment: 'happy', durationSec: 220 },
    { id: 'c4', customer: '@mhmd.ali', startedAt: '2026-06-26T13:30:00Z', summary: 'Sizing confusion, escalated to a human agent.', intent: 'order', sentiment: 'frustrated', value: 980, durationSec: 3240 },
    { id: 'c5', customer: '@layla.h', startedAt: '2026-06-25T20:18:00Z', summary: 'Exchange approved for white linen dress, size up.', intent: 'exchange', sentiment: 'happy', value: 1650, durationSec: 760 },
    { id: 'c6', customer: '@omar.sh', startedAt: '2026-06-25T11:02:00Z', summary: 'Refund processed — item out of stock, no alternative wanted.', intent: 'refund', sentiment: 'frustrated', value: 1300, durationSec: 980 },
  ];
}

// ─── The three keyed datasets ─────────────────────────────────────────────────
const DATA: Record<TimeRange, ReportsData> = {
  // 30d is the screenshot baseline: 34 DMs, 50% resolution, 3.3s response, 2 escalations.
  '30d': {
    range: '30d',
    rangeLabel: 'last 30 days',
    hero: {
      lunaRevenue: { value: 48500, deltaPct: 18, orderCount: 22 },
      resolutionRate: { value: 50, deltaPct: 6, resolvedByLuna: 17, escalated: 2, abandoned: 15 },
      avgTimeToResolutionSec: { value: 860, deltaPct: -12, lowerIsBetter: true },
      refundDeflectionRate: { value: 64, deltaPct: 9 },
    },
    commercial: {
      ordersByLuna: { count: 22, totalValue: 48500 },
      exchangesProcessed: { count: 9, valueRetained: 12400 },
      refundsProcessed: { count: 5, valueLost: 6800 },
      refundDeflection: { deflectionPct: 64, revenueSaved: 11200 },
    },
    quality: {
      resolutionByIntent: [
        { intent: 'order', rate: 68 },
        { intent: 'exchange', rate: 54 },
        { intent: 'refund', rate: 41 },
        { intent: 'faq', rate: 82 },
      ],
      avgMessagesToResolution: { value: 4.2, trend: [6.1, 5.7, 5.2, 4.8, 4.5, 4.2] },
      slowestConversations: rows().slice(3).sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0)),
    },
    trends: {
      issueCategories: {
        labels: ['W1', 'W2', 'W3', 'W4'],
        series: [
          { name: 'Product Quality', color: '#c45c5c', values: [3, 4, 6, 7] },
          { name: 'Shipping Delay', color: '#d4845c', values: [5, 4, 4, 3] },
          { name: 'Sizing', color: '#c9a227', values: [2, 3, 3, 4] },
        ],
      },
      sentiment: {
        labels: ['W1', 'W2', 'W3', 'W4'],
        summary: 'frustrated 40% → 62% — rising over the period',
        series: [
          { name: 'Frustrated', color: '#d4845c', values: [40, 48, 55, 62] },
          { name: 'Neutral', color: '#9ca3af', values: [38, 34, 30, 26] },
          { name: 'Happy', color: '#6bcf8f', values: [22, 18, 15, 12] },
        ],
      },
      recurringClusters: [
        { label: 'Jacket runs small', count: 8, trend: 'up', changePct: 33 },
        { label: 'Late delivery to Alexandria', count: 6, trend: 'up', changePct: 20 },
        { label: 'Hoodie color mismatch', count: 4, trend: 'down', changePct: -12 },
        { label: 'COD not available', count: 3, trend: 'flat', changePct: 0 },
      ],
    },
    demand: {
      topQuestions: [
        { label: 'Where is my order?', count: 41 },
        { label: 'Do you have my size?', count: 33 },
        { label: 'When does it restock?', count: 27 },
        { label: 'Can I exchange this?', count: 19 },
        { label: 'Do you ship to my city?', count: 14 },
      ],
      topProducts: [
        { label: 'Classic Jacket', count: 38 },
        { label: 'Black Hoodie', count: 31 },
        { label: 'White Linen Dress', count: 22 },
        { label: 'Cargo Trousers', count: 17 },
        { label: 'Knit Sweater', count: 11 },
      ],
      peakHours: { days: DAYS, buckets: BUCKETS, grid: makeGrid(1) },
      knowledgeGaps: [
        { id: 'g1', query: 'Do you offer gift wrapping?', count: 7, intentScore: 0.81 },
        { id: 'g2', query: 'Is the linen pre-shrunk?', count: 5, intentScore: 0.74 },
        { id: 'g3', query: 'Can I pay in installments?', count: 4, intentScore: 0.88 },
        { id: 'g4', query: 'Do you restock sold-out colors?', count: 3, intentScore: 0.69 },
      ],
    },
    drilldowns: {
      lunaRevenue: rows().filter((r) => r.intent === 'order' || r.intent === 'exchange'),
      resolutionRate: rows(),
      avgTimeToResolutionSec: rows().sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0)),
      refundDeflectionRate: rows().filter((r) => r.intent === 'exchange' || r.intent === 'refund'),
    },
  },

  '7d': {
    range: '7d',
    rangeLabel: 'last 7 days',
    hero: {
      lunaRevenue: { value: 12800, deltaPct: 11, orderCount: 6 },
      resolutionRate: { value: 45, deltaPct: 3, resolvedByLuna: 5, escalated: 1, abandoned: 5 },
      avgTimeToResolutionSec: { value: 920, deltaPct: -5, lowerIsBetter: true },
      refundDeflectionRate: { value: 58, deltaPct: 4 },
    },
    commercial: {
      ordersByLuna: { count: 6, totalValue: 12800 },
      exchangesProcessed: { count: 3, valueRetained: 4100 },
      refundsProcessed: { count: 2, valueLost: 2600 },
      refundDeflection: { deflectionPct: 58, revenueSaved: 3600 },
    },
    quality: {
      resolutionByIntent: [
        { intent: 'order', rate: 61 },
        { intent: 'exchange', rate: 48 },
        { intent: 'refund', rate: 36 },
        { intent: 'faq', rate: 77 },
      ],
      avgMessagesToResolution: { value: 4.6, trend: [5.4, 5.1, 4.9, 4.6] },
      slowestConversations: rows().slice(3, 6).sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0)),
    },
    trends: {
      issueCategories: {
        labels: ['Mon', 'Wed', 'Fri', 'Sun'],
        series: [
          { name: 'Product Quality', color: '#c45c5c', values: [1, 2, 2, 3] },
          { name: 'Shipping Delay', color: '#d4845c', values: [2, 1, 2, 1] },
          { name: 'Sizing', color: '#c9a227', values: [1, 1, 2, 2] },
        ],
      },
      sentiment: {
        labels: ['Mon', 'Wed', 'Fri', 'Sun'],
        summary: 'frustrated 44% → 57% — trending up this week',
        series: [
          { name: 'Frustrated', color: '#d4845c', values: [44, 49, 53, 57] },
          { name: 'Neutral', color: '#9ca3af', values: [36, 33, 31, 29] },
          { name: 'Happy', color: '#6bcf8f', values: [20, 18, 16, 14] },
        ],
      },
      recurringClusters: [
        { label: 'Jacket runs small', count: 3, trend: 'up', changePct: 25 },
        { label: 'Late delivery to Alexandria', count: 2, trend: 'flat', changePct: 0 },
        { label: 'Hoodie color mismatch', count: 1, trend: 'down', changePct: -20 },
      ],
    },
    demand: {
      topQuestions: [
        { label: 'Where is my order?', count: 12 },
        { label: 'Do you have my size?', count: 9 },
        { label: 'When does it restock?', count: 7 },
        { label: 'Can I exchange this?', count: 5 },
      ],
      topProducts: [
        { label: 'Classic Jacket', count: 11 },
        { label: 'Black Hoodie', count: 8 },
        { label: 'White Linen Dress', count: 6 },
        { label: 'Cargo Trousers', count: 4 },
      ],
      peakHours: { days: DAYS, buckets: BUCKETS, grid: makeGrid(0.4) },
      knowledgeGaps: [
        { id: 'g1', query: 'Do you offer gift wrapping?', count: 3, intentScore: 0.81 },
        { id: 'g3', query: 'Can I pay in installments?', count: 2, intentScore: 0.88 },
      ],
    },
    drilldowns: {
      lunaRevenue: rows().filter((r) => r.intent === 'order' || r.intent === 'exchange').slice(0, 3),
      resolutionRate: rows().slice(0, 4),
      avgTimeToResolutionSec: rows().slice(2).sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0)),
      refundDeflectionRate: rows().filter((r) => r.intent === 'exchange' || r.intent === 'refund'),
    },
  },

  today: {
    range: 'today',
    rangeLabel: 'today',
    hero: {
      lunaRevenue: { value: 3200, deltaPct: 6, orderCount: 2 },
      resolutionRate: { value: 33, deltaPct: -8, resolvedByLuna: 1, escalated: 0, abandoned: 2 },
      avgTimeToResolutionSec: { value: 1040, deltaPct: 3, lowerIsBetter: true },
      refundDeflectionRate: { value: 50, deltaPct: 0 },
    },
    commercial: {
      ordersByLuna: { count: 2, totalValue: 3200 },
      exchangesProcessed: { count: 1, valueRetained: 1500 },
      refundsProcessed: { count: 1, valueLost: 1300 },
      refundDeflection: { deflectionPct: 50, revenueSaved: 1500 },
    },
    quality: {
      resolutionByIntent: [
        { intent: 'order', rate: 50 },
        { intent: 'exchange', rate: 33 },
        { intent: 'refund', rate: 0 },
        { intent: 'faq', rate: 67 },
      ],
      avgMessagesToResolution: { value: 5.1, trend: [5.3, 5.1] },
      slowestConversations: rows().slice(3, 5).sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0)),
    },
    trends: {
      issueCategories: {
        labels: ['Morning', 'Afternoon', 'Evening'],
        series: [
          { name: 'Product Quality', color: '#c45c5c', values: [0, 1, 1] },
          { name: 'Shipping Delay', color: '#d4845c', values: [1, 0, 1] },
          { name: 'Sizing', color: '#c9a227', values: [0, 1, 0] },
        ],
      },
      sentiment: {
        labels: ['Morning', 'Afternoon', 'Evening'],
        summary: 'frustrated 50% → 67% — small sample today',
        series: [
          { name: 'Frustrated', color: '#d4845c', values: [50, 60, 67] },
          { name: 'Neutral', color: '#9ca3af', values: [33, 27, 22] },
          { name: 'Happy', color: '#6bcf8f', values: [17, 13, 11] },
        ],
      },
      recurringClusters: [
        { label: 'Jacket runs small', count: 1, trend: 'flat', changePct: 0 },
      ],
    },
    demand: {
      topQuestions: [
        { label: 'Where is my order?', count: 3 },
        { label: 'Do you have my size?', count: 2 },
        { label: 'Can I exchange this?', count: 1 },
      ],
      topProducts: [
        { label: 'Classic Jacket', count: 2 },
        { label: 'Black Hoodie', count: 2 },
        { label: 'Cargo Trousers', count: 1 },
      ],
      peakHours: { days: DAYS, buckets: BUCKETS, grid: makeGrid(0.12) },
      knowledgeGaps: [
        { id: 'g3', query: 'Can I pay in installments?', count: 1, intentScore: 0.88 },
      ],
    },
    drilldowns: {
      lunaRevenue: rows().filter((r) => r.intent === 'order').slice(0, 2),
      resolutionRate: rows().slice(0, 3),
      avgTimeToResolutionSec: rows().slice(3, 5).sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0)),
      refundDeflectionRate: rows().filter((r) => r.intent === 'refund' || r.intent === 'exchange').slice(0, 2),
    },
  },
};

/**
 * Returns the fully-typed Reports dataset for a time range.
 *
 * When the data layer lands, replace the body with a fetch to the Supabase
 * aggregation endpoint — the return shape is identical, so callers don't change.
 */
export function getReportsData(range: TimeRange): ReportsData {
  return DATA[range];
}

export const EMPTY_RANGE_NOTE =
  'no data for this period yet — numbers appear once conversations are analyzed';
