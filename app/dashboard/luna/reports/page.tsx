'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { getUserInfo, getReports } from '@/lib/api';
import LunaSidebar from '@/components/LunaSidebar';
import LunaTopBarActions from '@/components/LunaTopBarActions';

interface MonthVolume {
  month: string; // YYYY-MM
  count: number;
}

interface ReportsData {
  total_dms: { value: number; change: number };
  resolution_rate: { value: number; change: number };
  avg_response_ms: { value: number; change: number };
  escalations: { value: number; change: number };
  monthly_volume: MonthVolume[];
}

function formatMs(ms: number): string {
  if (ms === 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function shortMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleString('en-US', { month: 'short' });
}

export default function ReportsPage() {
  const router = useRouter();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    getUserInfo().then((res) => {
      const id = res.user?.brand_id || res.brand_id;
      if (id) setBrandId(id);
    }).catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    getReports(brandId, 30)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [brandId]);

  // Derive bar chart data from monthly_volume
  const monthlyVolume = data?.monthly_volume || [];
  const maxVol = Math.max(...monthlyVolume.map((m) => m.count), 1);
  const barHeights = monthlyVolume.map((m) => Math.max(8, Math.round((m.count / maxVol) * 100)));
  const barLabels = monthlyVolume.map((m) => shortMonth(m.month));

  const stats = data ? [
    {
      label: 'Total DMs (Month)',
      value: data.total_dms.value.toLocaleString(),
      delta: `${data.total_dms.change > 0 ? '+' : ''}${data.total_dms.change}%`,
      up: data.total_dms.change >= 0,
      icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>,
    },
    {
      label: 'Resolution Rate',
      value: `${data.resolution_rate.value}%`,
      delta: `${data.resolution_rate.change > 0 ? '+' : ''}${data.resolution_rate.change}%`,
      up: data.resolution_rate.change >= 0,
      icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    },
    {
      label: 'Avg Response',
      value: formatMs(data.avg_response_ms.value),
      delta: formatMs(Math.abs(data.avg_response_ms.change)),
      up: data.avg_response_ms.change <= 0, // lower is better
      icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    },
    {
      label: 'Escalations',
      value: String(data.escalations.value),
      delta: `${data.escalations.change > 0 ? '+' : ''}${data.escalations.change}`,
      up: data.escalations.change <= 0, // fewer is better
      icon: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    },
  ] : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 gap-3 p-3 max-md:pt-[60px]">
        <LunaSidebar />

        <main className="flex-1 rounded-2xl border border-border overflow-y-auto bg-background2">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 max-md:px-4 pt-[1.6rem] pb-0 flex-wrap gap-3">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">
                reports
              </h2>
              <p className="text-[0.72rem] text-text-secondary">performance data and exports</p>
            </div>
            <div className="max-md:hidden"><LunaTopBarActions /></div>
          </div>

          <div className="px-8 py-6 pb-12 flex flex-col gap-6">

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {loading || !stats ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-background border border-border rounded-[12px] p-[1.2rem] h-[110px] animate-pulse" />
                ))
              ) : (
                stats.map((s) => (
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
                ))
              )}
            </div>

            {/* Monthly volume bar chart */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Monthly Volume</div>
              <p className="text-[0.68rem] text-text-secondary mb-4">DM volume over the past 6 months</p>

              {loading ? (
                <div className="h-[70px] bg-border rounded animate-pulse" />
              ) : monthlyVolume.length === 0 ? (
                <div className="text-[0.72rem] text-text-tertiary py-4 text-center">no volume data yet</div>
              ) : (
                <>
                  <div className="flex items-end gap-[3px]" style={{ height: '70px' }}>
                    {barHeights.map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-[2px] transition-colors duration-200 hover:bg-text-tertiary ${h >= 90 ? 'bg-text-secondary' : 'bg-border-md'}`}
                        style={{ height: `${h}%` }}
                        title={`${monthlyVolume[i]?.count ?? 0} DMs`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {barLabels.map((l, i) => (
                      <span key={i} className="text-[0.55rem] text-text-tertiary">{l}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Export panel */}
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
