'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isLoggedIn } from '@/lib/auth';

const agents = [
  {
    id: 'luna',
    name: 'Luna',
    role: 'Customer Operations',
    description: 'Handles DMs on Instagram & WhatsApp with your brand voice, processes orders, and escalates complex issues.',
    status: 'live',
    stats: {
      conversations: '847',
      resolved: '96%'
    },
    icon: '🌙',
    available: true
  },
  {
    id: 'ivy',
    name: 'Ivy',
    role: 'Financial Visibility',
    description: 'Tracks revenue, expenses, and margins. Generates weekly P&L reports with actionable insights.',
    status: 'soon',
    stats: {
      revenue: '—',
      insights: '—'
    },
    icon: '💎',
    available: false
  },
  {
    id: 'agent3',
    name: '—',
    role: 'Performance Reporting',
    description: 'Coming soon. This agent will analyze your marketing performance and customer acquisition metrics.',
    status: 'soon',
    stats: {
      reports: '—',
      metrics: '—'
    },
    icon: '📊',
    available: false
  },
  {
    id: 'agent4',
    name: '—',
    role: 'Marketing Intelligence',
    description: 'Coming soon. This agent will optimize your content strategy and campaign performance.',
    status: 'soon',
    stats: {
      campaigns: '—',
      roi: '—'
    },
    icon: '🎯',
    available: false
  }
];

export default function MyKrewDashboard() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ first_name: '', last_name: '', email: '' });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
      return;
    }

    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, [router]);

  const handleAgentClick = (agent: typeof agents[0]) => {
    if (agent.available && agent.id === 'luna') {
      router.push('/dashboard/luna');
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-12">
        <div className="max-w-[1100px] mx-auto px-10 py-12">
          {/* Greeting */}
          <div className="mb-3">
            <h2 className="text-[1.5rem] font-light tracking-[-0.03em] mb-[0.2rem]">
              Welcome back, {userInfo.first_name || 'there'}
            </h2>
            <p className="text-[0.72rem] text-text-tertiary">Select an agent to manage your operations</p>
          </div>

          {/* Notifications */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-[0.2rem] mb-10">
            <div className="shrink-0 flex items-center gap-[6px] bg-background2 border border-border rounded-[20px] px-[11px] py-[5px] text-[0.67rem] text-text-secondary whitespace-nowrap hover:border-border-md transition-colors duration-200">
              <span className="w-1 h-1 rounded-full bg-text-tertiary" />
              Luna resolved 42 conversations today
              <span className="text-[0.58rem] uppercase tracking-[0.05em] text-text-tertiary">2H AGO</span>
            </div>
            <div className="shrink-0 flex items-center gap-[6px] bg-background2 border border-border rounded-[20px] px-[11px] py-[5px] text-[0.67rem] text-text-secondary whitespace-nowrap hover:border-border-md transition-colors duration-200">
              <span className="w-1 h-1 rounded-full bg-text-tertiary" />
              3 escalations pending review
              <span className="text-[0.58rem] uppercase tracking-[0.05em] text-text-tertiary">5H AGO</span>
            </div>
          </div>

          {/* Section Label */}
          <div className="text-[0.62rem] uppercase tracking-[0.1em] text-text-tertiary mb-4">Your agents</div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-border border border-border rounded-[14px] overflow-hidden">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleAgentClick(agent)}
                className={`bg-background p-8 ${agent.available ? 'cursor-pointer hover:bg-background2' : 'opacity-[0.42] pointer-events-none'} transition-colors duration-[180ms] flex flex-col gap-[1.4rem] min-h-[230px]`}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div className="w-[38px] h-[38px] border border-border-md rounded-[10px] flex items-center justify-center text-text-tertiary text-[15px]">
                    {agent.icon}
                  </div>
                  <div className={`flex items-center gap-[5px] text-[0.6rem] uppercase tracking-[0.05em] ${agent.status === 'live' ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                    {agent.status === 'live' && <span className="w-[5px] h-[5px] rounded-full bg-text-secondary shadow-[0_0_5px_var(--text-secondary)] animate-pulse" />}
                    {agent.status}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1">
                  <div className="text-[1.8rem] font-light tracking-[-0.04em] mb-[0.15rem]">{agent.name}</div>
                  <div className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-3">
                    {agent.role}
                  </div>
                  <p className="text-[0.73rem] text-text-secondary leading-[1.7] font-light max-w-[320px]">
                    {agent.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-[1.1rem] border-t border-border">
                  <div className="flex gap-7">
                    {Object.entries(agent.stats).map(([key, value]) => (
                      <div key={key}>
                        <div className="text-base font-light tracking-[-0.03em] mb-[1px]">{value}</div>
                        <div className="text-[0.58rem] uppercase tracking-[0.05em] text-text-tertiary">{key}</div>
                      </div>
                    ))}
                  </div>
                  {agent.available ? (
                    <div className="flex items-center gap-1 text-[0.67rem] text-text-tertiary group-hover:text-text-secondary transition-colors duration-150">
                      Open
                      <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17L17 7M17 7H7M17 7V17"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="text-[0.6rem] text-text-tertiary border border-border rounded px-[7px] py-[2px] uppercase tracking-[0.05em]">
                      Soon
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}