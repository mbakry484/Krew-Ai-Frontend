'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

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
    label: 'Knowledge',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    )
  },
  {
    href: '/dashboard/luna/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )
  },
];

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/dashboard/luna') return pathname === '/dashboard/luna';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Logo */}
      <div className="px-[1.2rem] pb-[1.5rem] border-b border-border mb-4">
        <div className="text-[0.85rem] font-medium tracking-[-0.01em] text-text-primary">Luna</div>
        <div className="text-[0.62rem] uppercase tracking-[0.07em] text-text-tertiary mt-[1px]">Customer Operations · Krew</div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-[2px] px-[0.6rem] flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={`flex items-center gap-[0.7rem] px-[0.8rem] py-[0.65rem] rounded-[8px] text-[0.75rem] transition-all duration-150 ${
              isActive(item.href)
                ? 'bg-background3 text-text-primary'
                : 'text-text-tertiary hover:bg-background3 hover:text-text-secondary'
            }`}
          >
            <span className="w-[15px] h-[15px] shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Back to My Krew */}
      <div className="px-[0.6rem] pt-4 border-t border-border mt-auto">
        <button
          onClick={() => { router.push('/dashboard'); onLinkClick?.(); }}
          className="flex items-center gap-[0.7rem] px-[0.8rem] py-[0.65rem] rounded-[8px] text-[0.75rem] text-text-tertiary hover:bg-background3 hover:text-text-secondary transition-all duration-150 w-full"
        >
          <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
          <span>My Krew</span>
        </button>
      </div>
    </>
  );
}

export default function LunaSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-[200px] shrink-0 border-r border-border bg-background flex flex-col py-6 max-md:hidden sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile toggle button — sits inside the top bar area of each page */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="hidden max-md:flex fixed top-3 left-4 z-[160] items-center gap-[5px] bg-background border border-border rounded-[7px] px-[10px] py-[5px] text-[0.72rem] text-text-secondary hover:border-border-md hover:text-text-primary transition-all duration-200"
      >
        <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        Menu
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[140] bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 left-0 bottom-0 z-[150] w-[200px] flex flex-col py-6 border-r border-border bg-background">
            <SidebarContent onLinkClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
