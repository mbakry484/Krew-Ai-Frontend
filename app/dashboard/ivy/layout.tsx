'use client';

import { IvyProvider } from '@/components/IvyProvider';
import IvyOnboarding from './components/onboarding/IvyOnboarding';

// Nested under /dashboard — ConditionalNavigation hides the public marketing
// navbar for /dashboard/ivy/*, so this subtree owns its full sidebar shell
// (same pattern as /dashboard/luna). IvyOnboarding overlays every Ivy page on
// first open (until onboarding.completed) — mounted here so it gates them all.
export default function IvyLayout({ children }: { children: React.ReactNode }) {
  return (
    <IvyProvider>
      {children}
      <IvyOnboarding />
    </IvyProvider>
  );
}
