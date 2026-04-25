'use client';

// The full Luna onboarding flow lives in /auth/signup/page.tsx — when a user
// is already signed in, that page detects the token and auto-skips the account
// (signup + name) steps to begin at the Brand step. So here we simply redirect
// to /auth/signup; the page picks up from the right place via localStorage and
// the isLoggedIn() check.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';

export default function OnboardingRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/auth/login');
      return;
    }
    router.replace('/auth/signup');
  }, [router]);

  return null;
}
