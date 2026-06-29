'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function ConditionalNavigation() {
  const pathname = usePathname();
  // Luna dashboard and all its sub-routes manage their own sidebar shell
  if (pathname.startsWith('/dashboard/luna')) return null;
  // The signup/onboarding flow is a full-screen, self-contained shell with its
  // own progress chrome — the floating marketing nav doesn't belong over it.
  // The /early-access waitlist mirrors that same stepped shell, so exclude it too.
  if (pathname.startsWith('/auth/signup')) return null;
  if (pathname.startsWith('/early-access')) return null;
  return <Navigation />;
}
