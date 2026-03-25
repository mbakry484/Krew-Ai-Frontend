'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// GET /api/luna/issues?period=today|week|month
//   Returns:
//   {
//     issues: [
//       {
//         id: string,
//         name: string,               // e.g. "Sizing issue"
//         description: string,        // e.g. "Customers can't find their size"
//         count: number,              // mentions in selected period
//         delta_pct: number,          // % change vs previous period (positive = increase)
//       }
//     ],
//     sentiment: {
//       angry: number,                // percentage 0-100
//       neutral: number,
//       positive: number,
//     }
//   }
//
// POST /api/luna/issues/export
//   Body: { format: 'pdf'|'csv' }
//   Returns: { download_url: string }
//
// POST /api/luna/issues/flag-team
//   Body: { issue_ids: string[] }
//   Returns: { success: boolean }
// =============================================================================

const ISSUES = [
  { id: '1', num: 12, name: 'Sizing issue',        desc: "Customers can't find their size in the chart",   delta: '+20%', up: true  },
  { id: '2', num: 8,  name: 'Late delivery',        desc: 'Orders taking longer than expected',             delta: '-10%', up: false },
  { id: '3', num: 5,  name: 'Color mismatch',       desc: 'Product color differs from photos',              delta: '+15%', up: true  },
  { id: '4', num: 4,  name: 'Product quality',      desc: 'Quality below customer expectations',            delta: '-5%',  up: false },
  { id: '5', num: 3,  name: 'Wrong item received',  desc: 'Fulfillment errors flagged',                     delta: '+8%',  up: true  },
];

export default function IssuesPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) router.push('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen pt-12 flex flex-col">
      <div className="flex flex-1">
        <LunaSidebar />

        <main className="flex-1 overflow-y-auto bg-background2">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 pt-[1.6rem] pb-0">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.2rem] lowercase">
                issues
              </h2>
              <p className="text-[0.72rem] text-text-secondary">recurring and flagged customer problems</p>
            </div>
          </div>

          <div className="px-8 py-6 pb-12 flex flex-col gap-6">

            {/* All Issues
                API: GET /api/luna/issues */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">All Issues</div>
              <p className="text-[0.68rem] text-text-secondary mb-4">Flagged and recurring problems</p>
              <div className="flex flex-col gap-[0.6rem]">
                {ISSUES.map((issue) => (
                  <div key={issue.id} className="flex items-center gap-4 bg-background2 border border-border rounded-[8px] p-4 hover:border-border-md transition-colors duration-150">
                    <div className="text-[1.1rem] font-light text-text-primary tracking-[-0.03em] min-w-[22px]">{issue.num}</div>
                    <div className="flex-1">
                      <div className="text-[0.75rem] text-text-primary mb-[1px]">{issue.name}</div>
                      <div className="text-[0.63rem] text-text-tertiary">{issue.desc}</div>
                    </div>
                    <div className={`text-[0.68rem] flex items-center gap-[3px] whitespace-nowrap ${issue.up ? 'text-[#e07070]' : 'text-text-tertiary'}`}>
                      {issue.up ? (
                        <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                      ) : (
                        <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7l10 10M17 7v10H7"/></svg>
                      )}
                      {issue.delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment + Quick Actions
                API sentiment: GET /api/luna/issues → sentiment {}
                API actions: POST /api/luna/issues/export, /flag-team */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Sentiment Analysis</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Customer mood on flagged issues</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Angry', pct: 15, color: '#c45c5c' },
                    { label: 'Neutral', pct: 45, color: 'var(--text-tertiary)' },
                    { label: 'Positive', pct: 40, color: '#5c9c6e' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-[0.72rem] mb-[5px]">
                        <span className="text-text-secondary">{s.label}</span>
                        <span className="text-text-tertiary">{s.pct}%</span>
                      </div>
                      <div className="bg-border-md rounded-[3px] h-1 overflow-hidden">
                        <div className="h-full rounded-[3px]" style={{ width: `${s.pct}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Quick Actions</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Respond to flagged issues</p>
                <div className="flex flex-col gap-2">
                  <button className="flex items-center gap-3 border border-border rounded-[8px] px-4 py-[0.8rem] text-[0.75rem] text-text-secondary hover:border-border-md hover:text-text-primary hover:bg-background2 transition-all duration-150 text-left w-full">
                    <svg className="w-[14px] h-[14px] shrink-0 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    export issues report
                  </button>
                  <button className="flex items-center gap-3 border border-border rounded-[8px] px-4 py-[0.8rem] text-[0.75rem] text-text-secondary hover:border-border-md hover:text-text-primary hover:bg-background2 transition-all duration-150 text-left w-full">
                    <svg className="w-[14px] h-[14px] shrink-0 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                    flag for team review
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
