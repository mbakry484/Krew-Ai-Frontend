'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// GET /api/luna/reports/summary?period=month
//   Returns:
//   {
//     total_dms: number,               // e.g. 1842
//     resolution_rate: number,          // percentage, e.g. 96
//     avg_response_ms: number,          // milliseconds, display as "0.4s"
//     escalations: number,              // e.g. 31
//     total_dms_delta: number,          // % change
//     resolution_delta: number,
//     response_delta: number,
//     escalations_delta: number,
//     monthly_volume: number[],         // 6 values for bar chart (last 6 months)
//     monthly_labels: string[],         // e.g. ["Sep","Oct","Nov","Dec","Jan","Feb"]
//   }
//
// POST /api/luna/reports/export
//   Body: { format: 'pdf'|'csv', period: 'daily'|'weekly'|'monthly' }
//   Returns: { download_url: string }
//
// POST /api/luna/reports/send-email
//   Body: { period: 'daily'|'weekly'|'monthly' }
//   Returns: { success: boolean }
// =============================================================================

// Bar heights for 6-month volume chart
const MONTHLY_BARS = [55, 68, 44, 78, 60, 94];
const MONTHLY_LABELS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) router.push('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <LunaSidebar />

        <main className="flex-1 overflow-y-auto bg-background2">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 pt-[1.6rem] pb-0">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.2rem] lowercase">
                reports
              </h2>
              <p className="text-[0.72rem] text-text-secondary">performance data and exports</p>
            </div>
          </div>

          <div className="px-8 py-6 pb-12 flex flex-col gap-6">

            {/* Summary stat cards
                API: GET /api/luna/reports/summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total DMs (Month)',
                  value: '1,842',
                  delta: '18%',
                  up: true,
                  icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                },
                {
                  label: 'Resolution Rate',
                  value: '96%',
                  delta: '3%',
                  up: true,
                  icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                },
                {
                  label: 'Avg Response',
                  value: '0.4s',
                  delta: '0.1s',
                  up: true,
                  icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
                },
                {
                  label: 'Escalations',
                  value: '31',
                  delta: '2',
                  up: false,
                  icon: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                },
              ].map((s) => (
                <div key={s.label} className="bg-background border border-border rounded-[12px] p-[1.2rem] hover:border-border-md transition-colors duration-200">
                  <div className="flex items-start justify-between mb-[0.9rem]">
                    <div className="text-text-tertiary">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{s.icon}</svg>
                    </div>
                    <div className={`text-[0.68rem] flex items-center gap-[3px] ${s.up ? 'text-[#6bcf8f]' : 'text-[#e07070]'}`}>
                      {s.up ? (
                        <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                      ) : (
                        <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7l10 10M17 7v10H7"/></svg>
                      )}
                      {s.delta}
                    </div>
                  </div>
                  <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary mb-[0.3rem]">{s.label}</div>
                  <div className="text-[1.9rem] font-light tracking-[-0.04em] text-text-primary">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Monthly volume bar chart
                API: GET /api/luna/reports/summary → monthly_volume[], monthly_labels[] */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Monthly Volume</div>
              <p className="text-[0.68rem] text-text-secondary mb-4">DM volume over the past 6 months</p>
              <div className="flex items-end gap-[3px]" style={{ height: '70px' }}>
                {MONTHLY_BARS.map((h, i) => (
                  <div key={i} className={`flex-1 rounded-t-[2px] transition-colors duration-200 hover:bg-text-tertiary ${h >= 90 ? 'bg-text-secondary' : 'bg-border-md'}`} style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {MONTHLY_LABELS.map((l) => <span key={l} className="text-[0.55rem] text-text-tertiary">{l}</span>)}
              </div>
            </div>

            {/* Export panel
                API: POST /api/luna/reports/export, /send-email */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Export Reports</div>
              <p className="text-[0.68rem] text-text-secondary mb-4">Download or share your data</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'daily report (PDF)', icon: <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/> },
                  { label: 'weekly report (CSV)', icon: <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/> },
                  { label: 'email monthly summary', icon: <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/> },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="flex items-center gap-3 border border-border rounded-[8px] px-4 py-[0.8rem] text-[0.75rem] text-text-secondary hover:border-border-md hover:text-text-primary hover:bg-background2 transition-all duration-150 text-left w-full"
                  >
                    <svg className="w-[14px] h-[14px] shrink-0 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      {action.icon}
                    </svg>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
