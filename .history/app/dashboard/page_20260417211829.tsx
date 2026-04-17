'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { getUserInfo } from '@/lib/api';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// GET /api/user/info
//   Returns: { first_name, last_name, email }
//
// GET /api/agents
//   Returns: [{ id, name, role, status: 'live'|'soon', stats: {...} }]
//   Current agents: luna (live), ivy (live), agent3 (soon), agent4 (soon)
//
// GET /api/notifications
//   Returns: [{ id, agent, message, time }]
//   Used for the notification chips row on this page
// =============================================================================

const agents = [
  {
    id: 'luna',
    name: 'Luna',
    role: 'Customer Operations',
    description: 'Handles Instagram and WhatsApp DMs with your brand voice, processes orders, and escalates complex issues.',
    status: 'live',
    stats: { conversations: '247', response: '0.4s' },
    available: true
  },
  {
    id: 'ivy',
    name: 'Ivy',
    role: 'Financial Visibility',
    description: 'Tracks expenses, cash flow, and profitability in real time. Surfaces financial signals so you always know where your money stands.',
    status: 'live',
    stats: { revenue: '$84k', growth: '+12%' },
    available: true
  },
  {
    id: 'agent3',
    name: '—',
    role: 'Performance Reporting',
    description: 'Coming soon. Automated weekly and monthly performance reports across all operations. Zero manual work, full clarity.',
    status: 'soon',
    stats: { reports: '—', metrics: '—' },
    available: false
  },
  {
    id: 'agent4',
    name: '—',
    role: 'Marketing Intelligence',
    description: 'Coming soon. Connects ad spend, content performance, and conversion data into one clear intelligence layer.',
    status: 'soon',
    stats: { campaigns: '—', roi: '—' },
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
      const parsed = JSON.parse(storedUser);
      setUserInfo(parsed);
      // If first_name is missing, fetch from API
      if (!parsed.first_name) {
        getUserInfo().then(res => {
          const user = res?.user ?? res;
          if (user?.first_name) setUserInfo(user);
        }).catch(() => {});
      }
    } else {
      getUserInfo().then(res => {
        const user = res?.user ?? res;
        if (user?.first_name) setUserInfo(user);
      }).catch(() => {});
    }
  }, [router]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleAgentClick = (agent: typeof agents[0]) => {
    if (agent.available && agent.id === 'luna') {
      router.push('/dashboard/luna');
    }
    // TODO: route to /dashboard/ivy when Ivy dashboard is built
  };

  return (
    <>
      <div className="min-h-screen pt-12">
        <div className="max-w-[1100px] mx-auto px-10 py-12">

          {/* Greeting */}
          <div className="mb-10">
            <h2 className="text-[1.5rem] font-light tracking-[-0.03em] mb-[0.2rem]">
              {getGreeting()}, {userInfo.first_name || 'there'}.
            </h2>
            <p className="text-[0.72rem] text-text-tertiary">Your agents are running. Here's what's happening.</p>
          </div>

          {/* Section label */}
          <div className="text-[0.62rem] uppercase tracking-[0.1em] text-text-tertiary mb-4">Your agents</div>

          {/* Agents grid
              API: GET /api/agents → array of agent objects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-border border border-border rounded-[14px] overflow-hidden">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleAgentClick(agent)}
                className={`bg-background p-8 transition-colors duration-[180ms] flex flex-col gap-[1.4rem] min-h-[230px] ${
                  agent.available ? 'cursor-pointer hover:bg-background2' : 'opacity-[0.42] pointer-events-none'
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="w-[38px] h-[38px] border border-border-md rounded-[10px] flex items-center justify-center text-text-tertiary">
                    {agent.id === 'luna' && (
                      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                      </svg>
                    )}
                    {agent.id === 'ivy' && (
                      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    )}
                    {agent.id === 'agent3' && (
                      <svg className="w-[15px] h-[15px] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    )}
                    {agent.id === 'agent4' && (
                      <svg className="w-[15px] h-[15px] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
                      </svg>
                    )}
                  </div>
                  <div className={`flex items-center gap-[5px] text-[0.6rem] uppercase tracking-[0.05em] ${agent.status === 'live' ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                    {agent.status === 'live' && <span className="w-[5px] h-[5px] rounded-full bg-text-secondary shadow-[0_0_5px_var(--text-secondary)] animate-pulse" />}
                    {agent.status}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1">
                  <div className="text-[1.8rem] font-light tracking-[-0.04em] mb-[0.15rem]">{agent.name}</div>
                  <div className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-3">{agent.role}</div>
                  <p className="text-[0.73rem] text-text-secondary leading-[1.7] font-light max-w-[320px]">{agent.description}</p>
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
                    <div className="flex items-center gap-1 text-[0.67rem] text-text-tertiary">
                      Open
                      <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="text-[0.6rem] text-text-tertiary border border-border rounded px-[7px] py-[2px] uppercase tracking-[0.05em]">
                      Coming to Krew
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
