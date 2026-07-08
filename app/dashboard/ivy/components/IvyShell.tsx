'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import IvySidebar from '@/components/IvySidebar';
import IvyTopBarActions from '@/components/IvyTopBarActions';

/**
 * Page shell for every Ivy page — identical structure to the Luna pages
 * (sidebar + rounded main panel + top bar with the shared actions cluster),
 * factored out so the six Ivy pages don't repeat it.
 */
export default function IvyShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  /** Extra controls rendered left of the top-bar actions (filters, buttons). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) router.push('/auth/login');
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 gap-3 p-3 max-md:pt-[60px]">
        <IvySidebar />

        <main className="flex-1 rounded-2xl border border-border bg-background2 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 max-md:px-4 pt-6 pb-5 flex-wrap gap-3 border-b border-border shrink-0">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">
                {title}
              </h2>
              <p className="text-[0.72rem] text-text-secondary">{subtitle}</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {actions}
              <div className="max-md:hidden"><IvyTopBarActions /></div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-8 max-md:px-4 py-6 pb-12 flex flex-col gap-6 scrollbar-hide">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
