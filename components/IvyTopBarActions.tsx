'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useIvy } from './IvyProvider';
import { ivyClient } from '@/lib/ivy/ivyClient';
import { logout } from '@/lib/auth';
import type { AppNotification } from '@/lib/notifications';

// Sibling of LunaTopBarActions — identical layout and behavior; Ivy's agent
// toggle (teal accent, via ivyClient) and Ivy-specific mock notifications.

const panelVisible = 'opacity-100 pointer-events-auto translate-y-0';
const panelHidden  = 'opacity-0 pointer-events-none -translate-y-[6px]';
const panelAnim    = 'transition-all duration-[150ms] ease-out';

type IvyNotificationType = 'return_spike' | 'expense_logged' | 'capital_low';

interface IvyNotification extends Omit<AppNotification, 'type'> {
  type: IvyNotificationType;
}

const IVY_NOTIFICATION_TYPE_LABEL: Record<IvyNotificationType, string> = {
  return_spike: 'Return rate',
  expense_logged: 'Expense logged',
  capital_low: 'Capital',
};

// Mocked, like Luna's — unread/read is local state only (resets on refresh).
const IVY_MOCK_NOTIFICATIONS: IvyNotification[] = [
  {
    id: 'ivy-n1',
    type: 'return_spike',
    label: 'Return rate jumped to 28% this month',
    time: '1h ago',
    href: '/dashboard/ivy',
    read: false,
  },
  {
    id: 'ivy-n2',
    type: 'expense_logged',
    label: 'Voice note logged: EGP 60,000 — fabrics and zippers',
    time: '5h ago',
    href: '/dashboard/ivy/activity',
    read: false,
  },
  {
    id: 'ivy-n3',
    type: 'capital_low',
    label: '80% of Main Operating Capital is spent',
    time: '1d ago',
    href: '/dashboard/ivy/capital',
    read: true,
  },
];

function NotificationIcon({ type }: { type: IvyNotificationType }) {
  const cls = 'w-[13px] h-[13px]';
  if (type === 'return_spike') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
  }
  if (type === 'expense_logged') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 14l6-6m-5.5.5h.01m4.99 4.99h.01M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    );
  }
  // capital_low
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h18M3 10l9-6 9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18" />
    </svg>
  );
}

export default function IvyTopBarActions() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { ivyEnabled } = useIvy();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ first_name: '', last_name: '', email: '' });

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<IvyNotification[]>(IVY_MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleNotifClick = (n: IvyNotification) => {
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setNotifOpen(false);
    router.push(n.href);
  };

  useEffect(() => {
    const stored = localStorage.getItem('user_info');
    if (stored) setUserInfo(JSON.parse(stored));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById('ivy-topbar-avatar');
      if (el && !el.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Close notifications dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById('ivy-topbar-notif');
      if (el && !el.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const initials = (
    userInfo.first_name && userInfo.last_name
      ? userInfo.first_name[0] + userInfo.last_name[0]
      : userInfo.first_name
        ? userInfo.first_name.slice(0, 2)
        : userInfo.email
          ? userInfo.email.slice(0, 2)
          : '?'
  ).toUpperCase();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex items-center gap-3 shrink-0">
      {/* Ivy global toggle — teal accent (Krew agent identity: Ivy = teal) */}
      <button
        onClick={() => ivyClient.toggleIvyEnabled()}
        title={ivyEnabled ? 'Ivy is live — click to disable globally' : 'Ivy is offline — click to enable globally'}
        className={`border rounded-[20px] px-[10px] py-1 flex items-center gap-[6px] text-[0.7rem] transition-all duration-200 ${
          ivyEnabled
            ? 'border-ivy-accent-border text-ivy-accent hover:brightness-110'
            : 'border-border text-text-tertiary hover:border-border-md hover:text-text-secondary'
        }`}
      >
        {ivyEnabled ? (
          <span className="relative flex h-[7px] w-[7px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ivy-accent opacity-60" />
            <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-ivy-accent" />
          </span>
        ) : (
          <span className="relative flex h-[7px] w-[7px]">
            <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-text-tertiary opacity-50" />
          </span>
        )}
        <span className="hidden sm:inline font-medium">Ivy</span>
        <span
          className={`relative w-[24px] h-[13px] rounded-full transition-colors duration-200 shrink-0 ${
            ivyEnabled ? 'bg-ivy-accent' : 'bg-border-md'
          }`}
        >
          <span
            className={`absolute top-[2px] w-[9px] h-[9px] rounded-full bg-background transition-all duration-200 ${
              ivyEnabled ? 'left-[13px]' : 'left-[2px]'
            }`}
          />
        </span>
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="border border-border rounded-[20px] px-[10px] py-1 flex items-center gap-[5px] text-[0.7rem] text-text-tertiary hover:border-border-md hover:text-text-secondary transition-all duration-200"
      >
        {theme === 'dark' ? (
          <svg className="w-[10px] h-[10px] fill-current" viewBox="0 0 24 24">
            <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
          </svg>
        ) : (
          <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1"  x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1"  y1="12" x2="3"  y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
            <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
          </svg>
        )}
        <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>

      {/* Notifications bell + dropdown */}
      <div className="relative" id="ivy-topbar-notif">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          aria-label="Notifications"
          className="relative w-[30px] h-[30px] rounded-full border border-border flex items-center justify-center text-text-tertiary hover:border-border-md hover:text-text-secondary transition-all duration-200"
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-[2px] -right-[2px] min-w-[15px] h-[15px] px-[3px] rounded-full bg-text-primary text-background text-[0.55rem] font-medium leading-none flex items-center justify-center tabular-nums">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className={`absolute top-[calc(100%+10px)] right-0 w-[300px] max-w-[calc(100vw-24px)] bg-background border border-border-md rounded-[10px] overflow-hidden z-[300] ${panelAnim} shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${notifOpen ? panelVisible : panelHidden}`}>
          <div className="flex items-center justify-between px-4 py-[0.7rem] border-b border-border">
            <span className="text-[0.75rem] font-medium text-text-primary">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[0.65rem] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
                <svg className="w-5 h-5 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-[0.72rem] text-text-tertiary">You&apos;re all caught up</span>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className="w-full flex items-start gap-[0.7rem] px-4 py-[0.8rem] border-b border-border last:border-b-0 hover:bg-background3 transition-all duration-150 text-left"
                >
                  <span className="mt-[1px] w-[26px] h-[26px] shrink-0 rounded-[8px] bg-background3 border border-border flex items-center justify-center text-text-secondary">
                    <NotificationIcon type={n.type} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-[0.7rem] font-medium text-text-primary">{IVY_NOTIFICATION_TYPE_LABEL[n.type]}</span>
                      {!n.read && <span className="w-[5px] h-[5px] rounded-full bg-ivy-accent shrink-0" />}
                    </span>
                    <span className="block text-[0.68rem] text-text-secondary leading-[1.45] mt-[1px]">{n.label}</span>
                    <span className="block text-[0.6rem] text-text-tertiary mt-[3px]">{n.time}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Avatar + dropdown */}
      <div className="relative" id="ivy-topbar-avatar">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-[30px] h-[30px] rounded-full bg-background3 border border-border-md flex items-center justify-center text-[0.75rem] font-medium text-text-primary hover:border-border-hover transition-colors duration-200"
        >
          {initials}
        </button>
        <div className={`absolute top-[calc(100%+10px)] right-0 w-[200px] bg-background border border-border-md rounded-[10px] overflow-hidden z-[300] ${panelAnim} shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${dropdownOpen ? panelVisible : panelHidden}`}>
          <div className="px-4 py-[0.9rem] border-b border-border">
            <div className="text-[0.78rem] font-medium text-text-primary mb-[1px]">{userInfo.first_name} {userInfo.last_name}</div>
            <div className="text-[0.68rem] text-text-tertiary">{userInfo.email}</div>
          </div>
          <button
            onClick={() => { router.push('/dashboard'); setDropdownOpen(false); }}
            className="w-full flex items-center gap-[0.6rem] px-4 py-[0.7rem] text-[0.75rem] text-text-secondary hover:bg-background3 hover:text-text-primary transition-all duration-150 text-left"
          >
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            My Krew
          </button>
          <button
            onClick={() => { router.push('/dashboard/ivy/settings'); setDropdownOpen(false); }}
            className="w-full flex items-center gap-[0.6rem] px-4 py-[0.7rem] text-[0.75rem] text-text-secondary hover:bg-background3 hover:text-text-primary transition-all duration-150 text-left"
          >
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Settings
          </button>
          <div className="h-[1px] bg-border" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-[0.6rem] px-4 py-[0.7rem] text-[0.75rem] text-text-tertiary hover:bg-background3 hover:text-text-secondary transition-all duration-150 text-left"
          >
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
