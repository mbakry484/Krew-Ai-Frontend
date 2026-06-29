'use client';

import { useState } from 'react';
import Modal from './Modal';
import { TimeRange } from '../mockReportsData';

type Format = 'pdf' | 'csv' | 'email';
type ExportRange = TimeRange | 'custom';

const FORMATS: { id: Format; label: string; desc: string; icon: JSX.Element }[] = [
  {
    id: 'pdf',
    label: 'PDF',
    desc: 'formatted report with charts',
    icon: <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
  },
  {
    id: 'csv',
    label: 'CSV',
    desc: 'raw rows for spreadsheets',
    icon: <path d="M9 17v-2m3 2v-4m3 4v-6M4 6h16M6 6v14a2 2 0 002 2h8a2 2 0 002-2V6" />,
  },
  {
    id: 'email',
    label: 'Email digest',
    desc: 'send a summary to an inbox',
    icon: <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  },
];

const RANGES: { id: ExportRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'custom', label: 'Custom' },
];

/**
 * KREW-style export modal. Step 1: pick a format (expands an options area).
 * Step 2: pick a timeframe (custom reveals date pickers). Footer action is a
 * STUB — PDF/CSV trigger a tiny placeholder file download, email fires a toast.
 * No real generation happens here.
 */
export default function ExportModal({
  initialRange,
  onClose,
  onToast,
}: {
  initialRange: TimeRange;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [format, setFormat] = useState<Format>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [recipient, setRecipient] = useState('');
  const [range, setRange] = useState<ExportRange>(initialRange);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  const customValid = range !== 'custom' || (!!from && !!to);
  const canSubmit = format === 'email' ? emailValid && customValid : customValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (format === 'email') {
      onToast(`Email digest queued to ${recipient}`);
      onClose();
      return;
    }
    // Stub: download a tiny placeholder so the button feels real.
    const ext = format;
    const body =
      format === 'csv'
        ? 'metric,value\nplaceholder,0\n'
        : '%PDF-1.4 placeholder Luna report — real generation lands with the export endpoint.';
    const blob = new Blob([body], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luna-report-${range}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    onToast(`${format.toUpperCase()} export started`);
    onClose();
  };

  const primaryLabel = format === 'email' ? 'Send digest' : 'Download';

  return (
    <Modal onClose={onClose} labelledBy="export-title" variant="center">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div id="export-title" className="text-[1.05rem] font-medium tracking-[-0.02em] text-text-primary">Export report</div>
        <p className="text-[0.68rem] text-text-secondary mt-[2px]">choose a format and timeframe</p>
      </div>

      <div className="overflow-y-auto px-6 py-5 flex flex-col gap-6">
        {/* Step 1 — format */}
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary mb-[0.6rem]">1 — format</div>
          <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
            {FORMATS.map((f) => {
              const active = format === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  aria-pressed={active}
                  className={`text-left rounded-[10px] border p-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 ${
                    active ? 'border-border-hover bg-background2' : 'border-border hover:border-border-md'
                  }`}
                >
                  <svg className={`w-[15px] h-[15px] mb-2 ${active ? 'text-text-primary' : 'text-text-tertiary'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{f.icon}</svg>
                  <div className="text-[0.74rem] text-text-primary font-medium">{f.label}</div>
                  <div className="text-[0.6rem] text-text-tertiary mt-[1px] leading-[1.35]">{f.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Expanding options area */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
            style={{ gridTemplateRows: '1fr' }}
          >
            <div className="overflow-hidden">
              <div className="mt-3 rounded-[10px] border border-border bg-background2 px-4 py-3">
                {format === 'pdf' && (
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[0.72rem] text-text-secondary">include charts</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={includeCharts}
                      onClick={() => setIncludeCharts((v) => !v)}
                      className={`relative w-[34px] h-[18px] rounded-full transition-colors duration-200 ${includeCharts ? 'bg-text-primary' : 'bg-border-md'}`}
                    >
                      <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-background transition-all duration-200 ${includeCharts ? 'left-[18px]' : 'left-[2px]'}`} />
                    </button>
                  </label>
                )}
                {format === 'csv' && (
                  <p className="text-[0.68rem] text-text-tertiary leading-[1.5]">
                    every metric on this page exported as raw rows — one file, no charts.
                  </p>
                )}
                {format === 'email' && (
                  <label className="block">
                    <span className="text-[0.66rem] text-text-tertiary block mb-[5px]">recipient email</span>
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="you@brand.com"
                      className="w-full bg-background border border-border rounded-[8px] px-3 py-2 text-[0.74rem] text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:border-border-hover"
                    />
                    {recipient && !emailValid && (
                      <span className="text-[0.6rem] text-[#e07070] mt-[4px] block">enter a valid email</span>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 — timeframe */}
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary mb-[0.6rem]">2 — timeframe</div>
          <div className="inline-flex rounded-[9px] border border-border p-[3px] bg-background2">
            {RANGES.map((r) => {
              const active = range === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  aria-pressed={active}
                  className={`px-3 py-[5px] rounded-[6px] text-[0.7rem] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 ${
                    active ? 'bg-background text-text-primary border border-border-md' : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {range === 'custom' && (
            <div className="grid grid-cols-2 gap-2 mt-3 motion-safe:animate-[reportFade_0.2s_ease-out]">
              <label className="block">
                <span className="text-[0.6rem] text-text-tertiary block mb-[4px]">from</span>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-background border border-border rounded-[8px] px-3 py-2 text-[0.72rem] text-text-primary focus-visible:outline-none focus-visible:border-border-hover" />
              </label>
              <label className="block">
                <span className="text-[0.6rem] text-text-tertiary block mb-[4px]">to</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-background border border-border rounded-[8px] px-3 py-2 text-[0.72rem] text-text-primary focus-visible:outline-none focus-visible:border-border-hover" />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-[8px] text-[0.74rem] text-text-secondary border border-border hover:border-border-md hover:text-text-primary transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-4 py-2 rounded-[8px] text-[0.74rem] font-medium bg-btn-bg text-btn-text hover:opacity-85 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
        >
          {primaryLabel}
        </button>
      </div>
    </Modal>
  );
}
