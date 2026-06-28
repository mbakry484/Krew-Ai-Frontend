# Reports Page — Spec

## Purpose & boundary

Reports is the **retrospective, downloadable** view. It answers: *how did Luna do over a chosen period, and what's the trend?*

The hard rule that keeps Reports from duplicating the Issues / Conversations pages:

> **Issues = state (what's happening now). Reports = change in state over time.**

If a metric only makes sense as "right now," it lives on Issues. If it makes sense as "over the last 30 days," it lives here.

Every stat card is a **doorway** — clicking it drills into the filtered conversations behind the number. No dead numbers.

---

## Cost reality (read this before worrying about quota)

Analytics here is **SQL aggregation, not LLM inference.**

- Resolution rate, order counts, refund deflection, response times, peak hours, intent breakdowns → `GROUP BY` / `COUNT` / `AVG` over data already being written. **Zero tokens.**
- Sentiment + intent classification are **already produced** in the async post-conversation analysis. Reports *reads* stored results; it does not re-classify. **Zero marginal tokens.**
- PDF export = HTML→PDF render. **Zero tokens.**

Marginal LLM cost of the entire Reports page ≈ 0. The work is "write the aggregation queries once," not "spend tokens per view."

---

## Layout

### Top bar
- `reports` title + subtitle.
- Existing **Luna toggle** and **Dark** toggle stay where they are (right side).
- **NEW: Time-range selector** (Today / 7d / 30d / Custom) — drives every number on the page.
- **NEW: Export button** beside the toggles. Opens the export modal (see below).

### Row 1 — Hero stat cards (clickable → drill into conversations)
| Card | Detail under it |
|---|---|
| **Luna-attributed revenue** | label: "orders taken by Luna (DM)" |
| **Resolution rate** | split: resolved by Luna / escalated / abandoned |
| **Avg time to resolution** | (full resolution, not first response) |
| **Refund deflection rate** | refunds turned into exchanges — revenue protection |

Each shows metric + delta vs. previous period.

### Row 2 — Commercial impact
- **Orders taken by Luna (DM-only)** + total value. *(No attribution-method breakdown for now — future work.)*
- Exchanges processed → value retained.
- Refunds processed → value lost.
- **Refund deflection**: % of refund requests Luna turned into exchanges + **revenue saved** (EGP value of deflected orders).

### Row 3 — Resolution quality
- Resolution rate **by intent type** (order / exchange / refund / FAQ).
- Avg messages-to-resolution trend (loop-fix progress shows here).
- Slowest conversations list (outliers dragging the average).

### Row 4 — Issues & sentiment **as trends** (NOT the live Issues list)
- Issue categories trending over time (e.g. Product Quality up 3 weeks running).
- **Sentiment trend line** (e.g. Frustrated 40% → 62%), not today's snapshot.
- Recurring issue clusters (same complaint across multiple customers).

### Row 5 — Customer & demand signals
- Top questions/intents ranked by frequency.
- Products most asked about (uses existing product similarity search).
- Peak DM hours/days heatmap.
- **Knowledge gaps**: unknown high-intent queries Luna couldn't answer, with a "teach Luna" action.

### Export modal (KREW style)
Triggered by the top-bar Export button:
1. Choose format (PDF / CSV / Email digest) — selecting one expands options below it.
2. Choose timeframe (Today / 7d / 30d / Custom).
3. Download / Send button.

---

## Refund deflection — data requirement

The metric only works if you flag conversations that **entered as a refund intent but exited as an exchange.** The flow-detector already owns state transitions, so log that intent shift (`refund → exchange`) as an event on the conversation. Without that flag you can't tell a deflected refund from someone who wanted an exchange to begin with — and that distinction *is* the metric.

```
deflection_rate = (refund-intent convos that ended as exchange) / (total refund-intent convos)
revenue_saved   = sum(order value of those deflected exchanges)
```

---

## Build order

1. **Frontend first** (this prompt) — full layout + export modal, bound to mock data shaped like the real query outputs. Lets you ship the UI and validate hierarchy before any backend.
2. **Data layer** — write the Supabase aggregation queries (one per row). Swap mock → live; should be a single data-source file change because the mock is shaped identically.
3. **Refund-deflection event logging** in flow-detector (prerequisite for that metric being real).
4. **PDF/CSV export endpoints** + email digest job.

## Frontend-only scope (no backend needed yet)
- Full responsive layout, all rows.
- Time-range selector (switches between mock datasets).
- Clickable cards → mock drill-down panel/state.
- Export modal: format → timeframe → button (button is a stub / no-op or downloads a sample file).
- Empty states + loading skeletons for every section.
- All numbers from a single `mockReportsData` module keyed by time range.
