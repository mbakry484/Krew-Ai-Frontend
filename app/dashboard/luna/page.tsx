'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';

export default function LunaOverview() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen pt-12 flex flex-col">
      <div className="flex flex-1">
        <LunaSidebar />

        <main className="flex-1 overflow-y-auto bg-background2">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 pt-6 pb-0">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.2rem]">
                Overview
              </h2>
              <p className="text-[0.72rem] text-text-secondary">
                Your Luna performance at a glance
              </p>
            </div>

            <div className="relative">
              <button className="flex items-center gap-2 bg-background border border-border rounded-[8px] px-3 py-[7px] text-[0.75rem] text-text-secondary hover:border-border-md hover:text-text-primary transition-all duration-200">
                <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                </svg>
                Last 7 days
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Conversations', value: '847', delta: '+12%', up: true },
                { label: 'Resolved Today', value: '42', delta: '+8%', up: true },
                { label: 'Avg Response Time', value: '2.3s', delta: '-15%', up: true },
                { label: 'Customer Satisfaction', value: '94%', delta: '+3%', up: true }
              ].map((stat) => (
                <div key={stat.label} className="bg-background border border-border rounded-[12px] p-5 hover:border-border-md transition-colors duration-200">
                  <div className="flex items-start justify-between mb-[0.9rem]">
                    <div />
                    <div className={`text-[0.68rem] flex items-center gap-[3px] ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.up ? '↑' : '↓'} {stat.delta}
                    </div>
                  </div>
                  <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary mb-[0.3rem]">
                    {stat.label}
                  </div>
                  <div className="text-[1.9rem] font-light tracking-[-0.04em] text-text-primary">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity & Insights */}
          <div className="px-8 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Activity */}
              <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">
                  Recent Activity
                </div>
                <p className="text-[0.68rem] text-text-secondary mb-[1.2rem]">
                  Last 24 hours
                </p>

                <div className="flex flex-col gap-0">
                  {[
                    { time: '2h ago', action: 'Resolved order inquiry', customer: 'Sarah M.' },
                    { time: '4h ago', action: 'Escalated technical issue', customer: 'Mike R.' },
                    { time: '6h ago', action: 'Processed return request', customer: 'Emma L.' },
                    { time: '8h ago', action: 'Answered product question', customer: 'James K.' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-[0.6rem] px-0 border-b border-border last:border-b-0 text-[0.69rem] text-text-secondary">
                      <span className="text-[0.58rem] text-text-tertiary min-w-[50px]">{item.time}</span>
                      <span className="w-[3px] h-[3px] rounded-full bg-text-tertiary shrink-0" />
                      <div className="flex-1">
                        {item.action} • {item.customer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Issues */}
              <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">
                  Top Issues
                </div>
                <p className="text-[0.68rem] text-text-secondary mb-[1.2rem]">
                  Most common inquiries
                </p>

                <div className="flex flex-col gap-[0.6rem]">
                  {[
                    { num: '23', name: 'Shipping delays', sub: 'Customers asking about delivery', delta: '+5' },
                    { num: '18', name: 'Size/fit questions', sub: 'Product dimension inquiries', delta: '+2' },
                    { num: '12', name: 'Return process', sub: 'How to return items', delta: '+1' },
                    { num: '9', name: 'Payment issues', sub: 'Card declines & errors', delta: '0' }
                  ].map((issue, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-background2 border border-border rounded-[8px] p-4 hover:border-border-md transition-colors duration-150">
                      <div className="text-[1.1rem] font-light text-text-primary tracking-[-0.03em] min-w-[22px]">
                        {issue.num}
                      </div>
                      <div className="flex-1">
                        <div className="text-[0.75rem] text-text-primary mb-[1px]">{issue.name}</div>
                        <div className="text-[0.63rem] text-text-tertiary">{issue.sub}</div>
                      </div>
                      <div className={`text-[0.68rem] whitespace-nowrap ${issue.delta.startsWith('+') ? 'text-red-400' : 'text-text-tertiary'}`}>
                        {issue.delta}
                      </div>
                    </div>
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