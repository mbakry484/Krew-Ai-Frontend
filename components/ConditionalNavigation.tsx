'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function ConditionalNavigation() {
  const pathname = usePathname();
  // Luna dashboard and all its sub-routes manage their own sidebar shell
  if (pathname.startsWith('/dashboard/luna')) return null;
  return <Navigation />;
}
