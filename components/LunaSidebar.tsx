'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LunaTopBarActions from '@/components/LunaTopBarActions';
import { useLunaGlobal } from '@/components/LunaGlobalProvider';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// No API calls from this component. It's a static navigation sidebar.
// The sidebar links map to these pages:
//   Overview            → GET /api/luna/overview
//   Conversations       → GET /api/luna/conversations
//   Issues              → GET /api/luna/issues
//   Exchanges & Refunds → GET /api/luna/exchanges-refunds
//   Reports             → GET /api/luna/reports
//   Knowledge Base      → GET/POST /api/luna/knowledge-base
//   Settings            → GET/PUT /api/luna/settings
// =============================================================================

const menuItems = [
  {
    href: '/dashboard/luna',
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
    href: '/dashboard/luna/conversations',
    label: 'Conversations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
      </svg>
    )
  },
  {
    href: '/dashboard/luna/issues',
    label: 'Issues',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )
  },
  {
    href: '/dashboard/luna/exchanges-refunds',
    label: 'Exchanges',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
    )
  },
  {
    href: '/dashboard/luna/reports',
    label: 'Reports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    )
  },
  {
    href: '/dashboard/luna/knowledge-base',
    label: 'Customize',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    )
  },
];

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard/luna') return pathname === '/dashboard/luna';
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
          <div className="text-[0.85rem] font-medium tracking-[-0.01em] text-text-primary mb-[1px]">Luna</div>
          <div className="text-[0.62rem] uppercase tracking-[0.07em] text-text-tertiary">Customer Operations · Krew</div>
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
          href="/dashboard/luna/settings"
          onClick={onLinkClick}
          className={`flex items-center gap-[0.7rem] px-3 py-2 rounded-xl text-[0.75rem] transition-all duration-150 w-full ${
            pathname === '/dashboard/luna/settings'
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

export default function LunaSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lunaGlobalEnabled } = useLunaGlobal();

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
        <div className="flex-1 flex items-center justify-center gap-[6px]">
          <span className="text-[0.78rem] font-medium tracking-[-0.01em] text-text-primary">Luna</span>
          {lunaGlobalEnabled ? (
            <span className="relative flex h-[6px] w-[6px]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-green-400" />
            </span>
          ) : (
            <span className="inline-flex rounded-full h-[6px] w-[6px] bg-text-tertiary opacity-50" />
          )}
        </div>
        <LunaTopBarActions />
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
