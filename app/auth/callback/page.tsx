'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://krew-ai-backend-production.up.railway.app';

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      background: 'var(--bg-base, #0a0a0a)',
      color: 'var(--text-primary, #f5f5f5)',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M15.5 3.5a9 9 0 1 0 5 5 7 7 0 0 1-5-5z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.5 }}>Signing you in…</p>
    </div>
  );
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      // Supabase may also deliver the session via URL fragment (#access_token=…)
      // when using implicit flow. The Supabase client detects and stores it automatically
      // on initialisation, so we just need to read the session.
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          await handleSession(session.access_token);
        } else {
          setErrorMsg('No authorization code received. Please try signing in again.');
        }
      });
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(async ({ data: { session }, error }) => {
      if (error || !session) {
        setErrorMsg(error?.message ?? 'Authentication failed. Please try again.');
        return;
      }
      await handleSession(session.access_token);
    });

    async function handleSession(accessToken: string) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/supabase/ensure-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        });

        const data = await res.json();

        if (!res.ok) {
          // User row couldn't be created — send them to signup to retry
          router.replace('/auth/signup?step=brand');
          return;
        }

        if (data.isNew || !data.user?.business_name) {
          // New OAuth user: needs to complete onboarding (brand name, voice, etc.)
          router.replace('/auth/signup?step=brand');
        } else {
          router.replace('/dashboard');
        }
      } catch {
        // Network failure — still redirect; onboarding will recover
        router.replace('/auth/signup?step=brand');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (errorMsg) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'var(--bg-base, #0a0a0a)',
        color: 'var(--text-primary, #f5f5f5)',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        padding: '0 24px',
      }}>
        <p style={{ margin: 0, color: '#f87171', fontSize: '0.85rem' }}>{errorMsg}</p>
        <a
          href="/auth/login"
          style={{ color: 'inherit', fontSize: '0.8rem', opacity: 0.6, textDecoration: 'underline' }}
        >
          Back to login
        </a>
      </div>
    );
  }

  return <Spinner />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackHandler />
    </Suspense>
  );
}
