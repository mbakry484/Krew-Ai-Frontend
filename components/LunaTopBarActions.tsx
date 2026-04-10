'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { logout } from '@/lib/auth';

const panelVisible = 'opacity-100 pointer-events-auto translate-y-0';
const panelHidden  = 'opacity-0 pointer-events-none -translate-y-[6px]';
const panelAnim    = 'transition-all duration-[150ms] ease-out';

export default function LunaTopBarActions() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ first_name: '', last_name: '', email: '' });

  useEffect(() => {
    const stored = localStorage.getItem('user_info');
    if (stored) setUserInfo(JSON.parse(stored));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById('luna-topbar-avatar');
      if (el && !el.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

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

      {/* Avatar + dropdown */}
      <div className="relative" id="luna-topbar-avatar">
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
            onClick={() => { router.push('/settings'); setDropdownOpen(false); }}
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
            className="w-full flex items-center gap-[0.6rem] px-4 py-[0.7rem] text-[0.75rem] text-red-400/60 hover:bg-red-500/5 hover:text-red-400/90 transition-all duration-150 text-left"
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
