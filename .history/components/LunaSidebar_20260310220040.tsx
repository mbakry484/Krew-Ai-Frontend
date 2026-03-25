'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function LunaSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { href: '/dashboard/luna', label: 'Overview', icon: '' },
    { href: '/dashboard/luna/conversations', label: 'Conversations', icon: '' },
    { href: '/dashboard/luna/knowledge-base', label: 'Knowledge Base', icon: '' },
    { href: '/dashboard/luna/settings', label: 'Settings', icon: '' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/luna') {
      return pathname === '/dashboard/luna';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`w-[200px] shrink-0 border-r border-border bg-background flex flex-col p-6 max-md:hidden sticky top-12 h-[calc(100vh-48px)] overflow-y-auto`}>
        {/* Logo */}
        <div className="pb-6 border-b border-border mb-4">
          <div className="text-[0.85rem] font-medium tracking-[-0.01em] text-text-primary mb-[1px]">
            Luna
          </div>
          <div className="text-[0.62rem] uppercase tracking-[0.07em] text-text-tertiary">
            Customer Ops
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-[2px] flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-[0.7rem] px-[0.8rem] py-[0.65rem] rounded-[8px] text-[0.75rem] transition-all duration-150 ${
                isActive(item.href)
                  ? 'bg-background3 text-text-primary'
                  : 'text-text-tertiary hover:bg-background3 hover:text-text-secondary'
              }`}
            >
              <span className="text-[15px]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-border">
          <button className="flex items-center gap-[0.6rem] px-[0.8rem] py-[0.65rem] rounded-[8px] text-[0.75rem] text-text-tertiary hover:text-text-secondary hover:bg-background3 transition-all duration-150 w-full">
            <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="hidden max-md:flex items-center gap-[5px] bg-none border border-border rounded-[7px] px-[10px] py-[5px] text-[0.72rem] text-text-secondary hover:border-border-md hover:text-text-primary transition-all duration-200"
      >
        <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        Menu
      </button>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <aside className="hidden max-md:flex md:hidden fixed top-12 left-0 bottom-0 z-[150] w-[200px] flex-col border-r border-border bg-background p-6">
          <div className="pb-6 border-b border-border mb-4">
            <div className="text-[0.85rem] font-medium tracking-[-0.01em] text-text-primary mb-[1px]">
              Luna
            </div>
            <div className="text-[0.62rem] uppercase tracking-[0.07em] text-text-tertiary">
              Customer Ops
            </div>
          </div>

          <nav className="flex flex-col gap-[2px] flex-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-[0.7rem] px-[0.8rem] py-[0.65rem] rounded-[8px] text-[0.75rem] transition-all duration-150 ${
                  isActive(item.href)
                    ? 'bg-background3 text-text-primary'
                    : 'text-text-tertiary hover:bg-background3 hover:text-text-secondary'
                }`}
              >
                <span className="text-[15px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
      )}
    </>
  );
}