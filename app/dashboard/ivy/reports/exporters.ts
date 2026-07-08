// =============================================================================
// IVY REPORTS — client-side export generation (real files, no stubs)
// =============================================================================
// PDF: a fully branded print document opened in a new window — the browser's
//   "Save as PDF" gives a clean, paginated, Krew-branded report. This is the
//   standard dependency-free approach; a server-rendered PDF can replace it
//   later behind the same function signature.
// Excel: CSV built from the same PnLStatement — opens directly in Excel.
// Both take selector output only, so they stay pure presentation.

import { PnLStatement } from '@/lib/ivy/ivyClient';
import { EXPENSE_CATEGORY_LABEL, REVENUE_CHANNEL_KIND_LABEL } from '@/lib/ivy/types';

export interface ReportMeta {
  periodLabel: string; // "This month"
  rangeLabel: string;  // "1 Jul – 8 Jul 2026"
  generatedAt: string; // "8 Jul 2026, 14:02"
  metrics: {
    marginPct: number | null;
    expenseRatioPct: number | null;
    returnRatePct: number | null;
    cashRemaining: number;
    runwayMonths: number | null;
  };
}

const egp = (n: number) => `EGP ${Math.round(n).toLocaleString('en-US')}`;
const neg = (n: number) => `(${egp(n).replace('EGP ', 'EGP ')})`;

// ── Excel (CSV) ───────────────────────────────────────────────────────────────

const csvCell = (v: string | number): string => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadReportCsv(pnl: PnLStatement, meta: ReportMeta) {
  const rows: (string | number)[][] = [
    ['Krew — Ivy Financial Report'],
    ['Period', `${meta.periodLabel} (${meta.rangeLabel})`],
    ['Generated', meta.generatedAt],
    ['Currency', 'EGP'],
    [],
    ['REVENUE'],
    ...pnl.revenue.map((r) => [
      `${r.channel.name} (${REVENUE_CHANNEL_KIND_LABEL[r.channel.kind]})`,
      Math.round(r.gross),
    ]),
    ['Gross revenue', Math.round(pnl.grossRevenue)],
    ['Returns', -Math.round(pnl.totalReturns)],
    ['Net revenue', Math.round(pnl.netRevenue)],
    [],
    ['OPERATING EXPENSES'],
    ...pnl.expenses.map((e) => [EXPENSE_CATEGORY_LABEL[e.category], -Math.round(e.total)]),
    ['Total operating expenses', -Math.round(pnl.totalExpenses)],
    [],
    ['NET PROFIT', Math.round(pnl.netProfit)],
    ['Profit margin', meta.metrics.marginPct !== null ? `${meta.metrics.marginPct.toFixed(1)}%` : '—'],
    ['Expense ratio', meta.metrics.expenseRatioPct !== null ? `${meta.metrics.expenseRatioPct.toFixed(1)}%` : '—'],
    ['Online return rate', meta.metrics.returnRatePct !== null ? `${meta.metrics.returnRatePct.toFixed(1)}%` : '—'],
    ['Cash remaining', Math.round(meta.metrics.cashRemaining)],
  ];

  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  // BOM so Excel opens it as UTF-8 without an import wizard.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `krew-ivy-report-${meta.periodLabel.toLowerCase().replace(/\s+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF (branded print document) ──────────────────────────────────────────────

const KREW_MARK = `<svg viewBox="665 1125 735 145" style="height:14px;width:auto" fill="#111827" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,2350) scale(0.1,-0.1)"><path d="M8005 11988 c-99 -106 -384 -399 -634 -650 l-454 -458 344 0 344 0 200 200 c110 110 207 200 216 200 9 0 23 -8 32 -18 15 -16 17 -45 17 -200 l0 -182 404 0 404 0 242 243 242 242 -183 3 c-114 1 -187 7 -196 13 -37 32 -20 53 352 424 201 201 365 367 365 370 0 3 -152 5 -338 5 l-338 0 -195 -193 c-107 -107 -201 -196 -210 -200 -22 -7 -59 19 -59 42 0 10 72 90 160 178 88 88 160 163 160 167 0 3 -156 6 -347 6 l-348 0 -180 -192z"/><path d="M9882 12148 c-9 -9 -12 -161 -12 -625 0 -595 1 -613 19 -623 28 -15 104 -12 127 4 18 14 19 26 16 204 -3 164 -1 195 13 224 23 44 168 178 194 178 14 0 76 -79 235 -304 119 -167 223 -307 232 -310 24 -9 147 -7 163 3 22 14 9 37 -145 248 -265 363 -342 472 -348 491 -5 15 42 67 235 255 135 132 239 242 237 249 -3 9 -31 14 -93 16 l-88 3 -296 -296 c-163 -162 -304 -295 -313 -295 -26 0 -30 41 -27 306 2 197 0 256 -10 268 -16 19 -121 22 -139 4z"/><path d="M11285 11816 c-65 -21 -97 -41 -151 -96 -29 -29 -57 -49 -63 -46 -6 4 -11 29 -11 56 0 60 -18 80 -70 80 -73 0 -70 19 -70 -464 0 -323 3 -435 12 -444 16 -16 113 -15 126 1 8 9 12 95 12 249 1 250 10 318 48 380 49 79 112 120 205 133 62 9 77 26 77 81 0 83 -25 98 -115 70z"/><path d="M11730 11816 c-181 -32 -311 -171 -347 -371 -24 -140 6 -298 80 -406 81 -121 203 -174 380 -167 86 3 110 8 153 31 91 46 151 112 180 196 18 52 11 68 -35 76 -56 9 -84 -7 -119 -68 -42 -75 -105 -107 -206 -107 -39 1 -88 7 -109 14 -84 31 -149 108 -166 200 -8 41 -6 51 10 67 18 18 38 19 328 19 263 0 310 2 321 15 17 21 8 132 -19 216 -67 212 -241 322 -451 285z m176 -154 c49 -25 100 -80 125 -136 23 -50 23 -60 3 -80 -13 -14 -49 -16 -243 -16 -254 0 -259 1 -247 63 14 75 85 154 165 184 49 18 146 11 197 -15z"/><path d="M12233 11803 c-28 -11 -18 -48 157 -588 32 -99 66 -206 75 -237 22 -79 34 -88 108 -88 34 0 67 4 73 8 16 10 24 40 105 362 65 263 82 311 101 292 4 -4 43 -148 87 -320 44 -172 85 -320 91 -328 19 -22 132 -19 152 4 9 9 50 125 91 257 42 132 101 319 132 415 59 187 61 200 43 218 -18 18 -93 15 -116 -5 -16 -14 -43 -98 -106 -331 -47 -172 -91 -323 -97 -334 -11 -21 -12 -21 -25 -4 -7 10 -20 48 -28 85 -13 56 -104 412 -137 533 -5 20 -16 44 -25 53 -22 22 -116 20 -142 -2 -16 -14 -37 -86 -91 -306 -39 -158 -71 -292 -71 -298 0 -5 -7 -26 -15 -46 -13 -32 -17 -35 -29 -22 -8 8 -30 75 -51 149 -20 74 -45 164 -55 200 -10 36 -33 119 -50 185 -37 139 -50 155 -119 154 -25 0 -52 -3 -58 -6z"/><path d="M13656 11755 c-41 -22 -55 -44 -56 -90 0 -75 62 -124 134 -104 40 11 76 57 76 97 0 36 -27 80 -60 97 -37 19 -57 19 -94 0z"/><path d="M13665 11705 c-29 -28 -31 -51 -9 -83 20 -29 79 -31 94 -2 12 23 -2 27 -20 5 -18 -21 -37 -19 -54 8 -31 46 14 98 54 62 11 -10 20 -12 24 -6 7 11 -31 41 -52 41 -7 0 -24 -11 -37 -25z"/></g></svg>`;

const TEAL = '#0d9488';

function pdfRow(label: string, value: string, opts: { sub?: boolean; total?: boolean; negative?: boolean } = {}) {
  const pad = opts.sub ? 'padding-left:14px;' : '';
  const weight = opts.total ? 'font-weight:600;border-top:1px solid #d9dde3;' : 'border-top:1px solid #eef0f3;';
  const color = opts.negative ? 'color:#b4514f;' : '';
  return `<tr>
    <td style="padding:9px 0;font-size:11.5px;color:${opts.sub ? '#6b7280' : '#111827'};${pad}${weight}">${label}</td>
    <td style="padding:9px 0;font-size:11.5px;text-align:right;font-variant-numeric:tabular-nums;${weight}${color}">${value}</td>
  </tr>`;
}

export function openReportPdf(pnl: PnLStatement, meta: ReportMeta) {
  const m = meta.metrics;
  const metricBlock = (label: string, value: string, accent = false) => `
    <div style="flex:1;min-width:110px;">
      <div style="font-size:8.5px;text-transform:uppercase;letter-spacing:0.09em;color:#9ca3af;margin-bottom:5px;">${label}</div>
      <div style="font-size:19px;font-weight:300;letter-spacing:-0.03em;color:${accent ? TEAL : '#111827'};font-variant-numeric:tabular-nums;">${value}</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Krew — Ivy Financial Report · ${meta.periodLabel}</title>
<style>
  @page { margin: 18mm 16mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111827; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  table { width: 100%; border-collapse: collapse; }
</style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
    ${KREW_MARK}
    <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.14em;color:#9ca3af;">
      Ivy · Financial Visibility
    </div>
  </div>

  <!-- Title -->
  <div style="margin:28px 0 6px;">
    <div style="font-size:27px;font-weight:300;letter-spacing:-0.03em;">Profit &amp; Loss</div>
    <div style="font-size:11px;color:#6b7280;margin-top:4px;">${meta.periodLabel} · ${meta.rangeLabel}</div>
  </div>

  <!-- Metric band -->
  <div style="display:flex;gap:22px;flex-wrap:wrap;margin:22px 0 26px;padding:16px 18px;background:#f8f9fb;border:1px solid #eef0f3;border-radius:12px;">
    ${metricBlock('Net profit', egp(pnl.netProfit), true)}
    ${metricBlock('Profit margin', m.marginPct !== null ? `${m.marginPct.toFixed(1)}%` : '—')}
    ${metricBlock('Net revenue', egp(pnl.netRevenue))}
    ${metricBlock('Expense ratio', m.expenseRatioPct !== null ? `${m.expenseRatioPct.toFixed(1)}%` : '—')}
    ${metricBlock('Cash remaining', egp(m.cashRemaining))}
  </div>

  <!-- P&L -->
  <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:${TEAL};margin-bottom:6px;">Revenue</div>
  <table>
    ${pnl.revenue.map((r) => pdfRow(`${r.channel.name} — ${REVENUE_CHANNEL_KIND_LABEL[r.channel.kind]}`, egp(r.gross), { sub: true })).join('')}
    ${pdfRow('Gross revenue', egp(pnl.grossRevenue), { total: true })}
    ${pdfRow('Returns (COD)', neg(pnl.totalReturns), { sub: true, negative: true })}
    ${pdfRow('Net revenue', egp(pnl.netRevenue), { total: true })}
  </table>

  <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:${TEAL};margin:22px 0 6px;">Operating expenses</div>
  <table>
    ${pnl.expenses.map((e) => pdfRow(EXPENSE_CATEGORY_LABEL[e.category], neg(e.total), { sub: true, negative: true })).join('')}
    ${pdfRow('Total operating expenses', neg(pnl.totalExpenses), { total: true, negative: true })}
  </table>

  <!-- Net profit -->
  <div style="display:flex;align-items:baseline;justify-content:space-between;margin-top:24px;padding:15px 18px;border-radius:12px;background:${pnl.netProfit >= 0 ? 'rgba(13,148,136,0.07)' : 'rgba(180,81,79,0.07)'};border:1px solid ${pnl.netProfit >= 0 ? 'rgba(13,148,136,0.25)' : 'rgba(180,81,79,0.25)'};">
    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Net profit</span>
    <span style="font-size:21px;font-weight:400;letter-spacing:-0.03em;color:${pnl.netProfit >= 0 ? TEAL : '#b4514f'};font-variant-numeric:tabular-nums;">
      ${egp(pnl.netProfit)}${m.marginPct !== null ? ` <span style="font-size:11px;color:#9ca3af;font-weight:300;">· ${m.marginPct.toFixed(1)}% margin</span>` : ''}
    </span>
  </div>

  <!-- Footer -->
  <div style="margin-top:34px;padding-top:12px;border-top:1px solid #eef0f3;display:flex;justify-content:space-between;font-size:8.5px;color:#9ca3af;">
    <span>Generated ${meta.generatedAt} · numbers from live Ivy data</span>
    <span>Prepared by Ivy — Krew</span>
  </div>

  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
