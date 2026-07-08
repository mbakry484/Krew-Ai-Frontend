'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import IvyTopBarActions from '@/components/IvyTopBarActions';

// Sibling of LunaSidebar — identical shell pattern, Ivy's nav map.
// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// No API calls from this component. It's a static navigation sidebar.
// The sidebar links map to these pages:
//   Overview   → GET /api/ivy/overview
//   Revenue    → GET/POST /api/ivy/revenue-channels + /api/ivy/revenue-snapshots
//   Expenses   → GET/POST /api/ivy/expenses
//   Capital    → GET/POST /api/ivy/capitals
//   Inventory  → GET/PUT /api/ivy/inventory + /api/ivy/target
//   Reports    → derived (P&L from revenue + expenses), exports client-side
//   Activity   → GET /api/ivy/activity
//   Settings   → GET/PUT /api/ivy/settings
// =============================================================================

const menuItems = [
  {
    href: '/dashboard/ivy',
    label: 'Overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )
  },
  {
    href: '/dashboard/ivy/revenue',
    label: 'Revenue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="6" rx="8" ry="3"/>
        <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" strokeLinecap="round"/>
        <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    href: '/dashboard/ivy/expenses',
    label: 'Expenses',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 14l6-6m-5.5.5h.01m4.99 4.99h.01M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    href: '/dashboard/ivy/capital',
    label: 'Capital',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 10h18M3 10l9-6 9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    href: '/dashboard/ivy/inventory',
    label: 'Inventory',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11m-8-4v10l8 4"/>
      </svg>
    )
  },
  {
    href: '/dashboard/ivy/reports',
    label: 'Reports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6"/>
        <path d="M9 17v-4m3 4v-2m3 2v-6"/>
      </svg>
    )
  },
  {
    href: '/dashboard/ivy/activity',
    label: 'Activity',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
];

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard/ivy') return pathname === '/dashboard/ivy';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Logo */}
      <div className="flex items-stretch border-b border-border mb-4">
        <Link
          href="/dashboard"
          title="Back to My Krew"
          className="flex items-center justify-center w-[38px] shrink-0 border-r border-border text-text-tertiary hover:bg-background3 hover:text-text-secondary transition-all duration-150 group"
        >
          <svg className="w-[13px] h-[13px] transition-transform duration-150 group-hover:-translate-x-[2px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div className="px-[1rem] pt-[1.1rem] pb-[1.2rem] flex-1">
          <div className="text-[0.85rem] font-medium tracking-[-0.01em] text-text-primary mb-[1px]">Ivy</div>
          <div className="text-[0.62rem] uppercase tracking-[0.07em] text-text-tertiary">Financial Visibility · Krew</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-[2px] px-[0.6rem] md:flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={`flex items-center gap-[0.7rem] px-3 py-2 rounded-xl text-[0.75rem] transition-all duration-150 ${
              isActive(item.href)
                ? 'bg-background4 text-text-primary'
                : 'text-text-tertiary hover:bg-background3 hover:text-text-secondary'
            }`}
          >
            <span className="w-[15px] h-[15px] shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Settings */}
      <div className="px-[0.6rem] pt-4 border-t border-border mt-auto">
        <Link
          href="/dashboard/ivy/settings"
          onClick={onLinkClick}
          className={`flex items-center gap-[0.7rem] px-3 py-2 rounded-xl text-[0.75rem] transition-all duration-150 w-full ${
            pathname === '/dashboard/ivy/settings'
              ? 'bg-background4 text-text-primary'
              : 'text-text-tertiary hover:bg-background3 hover:text-text-secondary'
          }`}
        >
          <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>Settings</span>
        </Link>
      </div>
    </>
  );
}

export default function IvySidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-[200px] shrink-0 rounded-2xl border border-border bg-background2 flex flex-col pt-0 pb-4 max-md:hidden overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="hidden max-md:flex fixed top-0 left-0 right-0 h-12 z-[160] items-center px-4 bg-background border-b border-border">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-center w-8 h-8 rounded-[7px] text-text-secondary hover:bg-background3 hover:text-text-primary transition-all duration-200"
          aria-label="Open menu"
        >
          <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span className="flex-1 text-center text-[0.78rem] font-medium tracking-[-0.01em] text-text-primary">Ivy</span>
        <IvyTopBarActions />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[140] bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-[52px] left-3 z-[150] w-[200px] flex flex-col py-4 rounded-2xl border border-border bg-background2 max-h-[calc(100vh-64px)] overflow-y-auto">
            <SidebarContent onLinkClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
