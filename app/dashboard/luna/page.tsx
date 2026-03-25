'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// GET /api/luna/overview?period=today|yesterday|week|month
//   Returns:
//   {
//     stats: {
//       orders_from_dms: number,       // Orders placed via DM conversations
//       return_requests: number,        // Return requests received
//       refund_requests: number,        // Refund requests received
//       total_conversations: number,    // Total DM conversations handled
//       orders_delta: number,           // % change vs previous period
//       returns_delta: number,
//       refunds_delta: number,
//       conversations_delta: number,
//     },
//     hourly_volume: number[],          // 12 values (8am→6am) for bar chart
//     weekly_volume: number[],          // 7 values (Mon→Sun) for bar chart
//     top_issues: [{ name, count, delta_pct }],
//     sentiment: { angry: number, neutral: number, positive: number },  // percentages
//   }
//
// POST /api/luna/reports/export
//   Body: { format: 'pdf'|'csv', period: 'daily'|'weekly'|'monthly' }
//   Returns: { download_url: string }
//
// POST /api/luna/reports/send-email
//   Body: { period: 'daily'|'weekly'|'monthly' }
//   Returns: { success: boolean }
//
// POST /api/luna/reports/send-whatsapp
//   Body: { period: 'daily' }
//   Returns: { success: boolean }
// =============================================================================

const TIME_OPTIONS = ['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month'];

// Bar heights for daily breakdown (12 hourly slots: 8am → 6am)
const HOURLY_BARS = [30, 20, 25, 40, 60, 75, 95, 80, 70, 65, 50, 45];
const HOURLY_LABELS = ['8am','10','12','2pm','4','6','8','10','12','2am','4','6'];

// Bar heights for weekly (Mon → Sun)
const WEEKLY_BARS = [55, 62, 48, 70, 65, 92, 78];
const WEEKLY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function LunaOverview() {
  const router = useRouter();
  const [timeLabel, setTimeLabel] = useState('Today');
  const [timeOpen, setTimeOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ first_name: '', last_name: '' });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
      return;
    }
    const stored = localStorage.getItem('user_info');
    if (stored) setUserInfo(JSON.parse(stored));
  }, [router]);

  // Close time dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = document.getElementById('time-filter');
      if (el && !el.contains(e.target as Node)) setTimeOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const initials = `${userInfo.first_name?.[0] || ''}${userInfo.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen pt-12 flex flex-col">
      <div className="flex flex-1">
        <LunaSidebar />

        <main className="flex-1 overflow-y-auto bg-background2">

          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 pt-[1.6rem] pb-0 flex-wrap gap-3">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.2rem] lowercase">
                daily support summary
              </h2>
              <p className="text-[0.72rem] text-text-secondary">
                customer support overview and insights
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile menu toggle — rendered inside LunaSidebar via context */}

              {/* Time filter
                  API: passes ?period= to GET /api/luna/overview */}
              <div className="relative" id="time-filter">
                <button
                  onClick={() => setTimeOpen(!timeOpen)}
                  className="flex items-center gap-2 bg-background border border-border rounded-[8px] px-3 py-[7px] text-[0.75rem] text-text-secondary hover:border-border-md hover:text-text-primary transition-all duration-200"
                >
                  <span>{timeLabel}</span>
                  <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {timeOpen && (
                  <div className="absolute top-[calc(100%+6px)] right-0 bg-background border border-border-md rounded-[10px] overflow-hidden z-50 min-w-[160px] shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
                    {TIME_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setTimeLabel(opt); setTimeOpen(false); }}
                        className={`block w-full px-4 py-[0.65rem] text-[0.75rem] text-left transition-all duration-150 ${
                          timeLabel === opt ? 'text-text-primary bg-background3' : 'text-text-secondary hover:bg-background3 hover:text-text-primary'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User chip */}
              <div className="flex items-center gap-2 text-[0.75rem] text-text-secondary">
                <div className="w-[26px] h-[26px] rounded-full bg-background4 border border-border-md flex items-center justify-center text-[0.6rem] font-semibold text-text-secondary">
                  {initials}
                </div>
                <span className="hidden sm:inline">{userInfo.first_name?.toLowerCase()}{userInfo.last_name?.toLowerCase()}</span>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 pb-12 flex flex-col gap-6">

            {/* Stat cards
                API: GET /api/luna/overview → stats object */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Orders from DMs',
                  value: '48',
                  delta: '12%',
                  up: true,
                  icon: <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/>
                },
                {
                  label: 'Return Requests',
                  value: '23',
                  delta: '8%',
                  up: false,
                  icon: <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                },
                {
                  label: 'Refund Requests',
                  value: '15',
                  delta: '5%',
                  up: true,
                  icon: <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                },
                {
                  label: 'Total Conversations',
                  value: '142',
                  delta: '18%',
                  up: true,
                  icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
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

            {/* Bar charts row
                API: GET /api/luna/overview → hourly_volume[], weekly_volume[] */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Daily Breakdown</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Conversation volume by hour</p>
                <div className="flex items-end gap-[3px] h-[52px]">
                  {HOURLY_BARS.map((h, i) => (
                    <div key={i} className={`flex-1 rounded-t-[2px] transition-colors duration-200 hover:bg-text-tertiary ${h >= 90 ? 'bg-text-secondary' : 'bg-border-md'}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {HOURLY_LABELS.map((l) => <span key={l} className="text-[0.55rem] text-text-tertiary">{l}</span>)}
                </div>
              </div>

              <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Monthly Trends</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Conversations over time</p>
                <div className="flex items-end gap-[3px] h-[52px]">
                  {WEEKLY_BARS.map((h, i) => (
                    <div key={i} className={`flex-1 rounded-t-[2px] transition-colors duration-200 hover:bg-text-tertiary ${h >= 90 ? 'bg-text-secondary' : 'bg-border-md'}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {WEEKLY_LABELS.map((l) => <span key={l} className="text-[0.55rem] text-text-tertiary">{l}</span>)}
                </div>
              </div>
            </div>

            {/* Top Issues
                API: GET /api/luna/overview → top_issues[] */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Top Issues</div>
              <p className="text-[0.68rem] text-text-secondary mb-4">Most common customer concerns</p>
              <div className="flex flex-col gap-[0.6rem]">
                {[
                  { num: 12, name: 'Sizing issue', sub: 'mentions today', delta: '+20%', up: true },
                  { num: 8,  name: 'Late delivery', sub: 'mentions today', delta: '-10%', up: false },
                  { num: 5,  name: 'Color mismatch', sub: 'mentions today', delta: '+15%', up: true },
                  { num: 4,  name: 'Product quality', sub: 'mentions today', delta: '-5%', up: false },
                ].map((issue) => (
                  <div key={issue.name} className="flex items-center gap-4 bg-background2 border border-border rounded-[8px] p-4 hover:border-border-md transition-colors duration-150">
                    <div className="text-[1.1rem] font-light text-text-primary tracking-[-0.03em] min-w-[22px]">{issue.num}</div>
                    <div className="flex-1">
                      <div className="text-[0.75rem] text-text-primary mb-[1px]">{issue.name}</div>
                      <div className="text-[0.63rem] text-text-tertiary">{issue.sub}</div>
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
                API sentiment: GET /api/luna/overview → sentiment { angry, neutral, positive }
                API quick actions: POST /api/luna/reports/export, /send-email, /send-whatsapp */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Sentiment Analysis</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Customer mood overview</p>
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
                <p className="text-[0.68rem] text-text-secondary mb-4">Export and share reports</p>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      label: 'export daily report (pdf/csv)',
                      icon: <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    },
                    {
                      label: 'send summary to email',
                      icon: <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    },
                    {
                      label: 'send to whatsapp',
                      icon: <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    },
                    {
                      label: 'open conversations',
                      icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                    },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="flex items-center gap-3 bg-none border border-border rounded-[8px] px-4 py-[0.8rem] text-[0.75rem] text-text-secondary hover:border-border-md hover:text-text-primary hover:bg-background2 transition-all duration-150 text-left w-full"
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

          </div>
        </main>
      </div>
    </div>
  );
}
