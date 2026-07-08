'use client';

import { IvyProvider } from '@/components/IvyProvider';

// Nested under /dashboard — ConditionalNavigation hides the public marketing
// navbar for /dashboard/ivy/*, so this subtree owns its full sidebar shell
// (same pattern as /dashboard/luna).
export default function IvyLayout({ children }: { children: React.ReactNode }) {
  return <IvyProvider>{children}</IvyProvider>;
}
