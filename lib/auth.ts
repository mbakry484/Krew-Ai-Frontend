// JWT token management and authentication helpers.
// Legacy tokens (krew_token / krew_refresh_token) are kept for existing accounts.
// New accounts use Supabase Auth — the Supabase client stores its own session
// in localStorage under `sb-<ref>-auth-token`; those are read in lib/api.ts.

import { supabase } from './supabase';

// ── Legacy token helpers (kept for rollback / existing accounts) ─────────────

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('krew_token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('krew_token', token);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('krew_refresh_token');
};

export const setRefreshToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('krew_refresh_token', token);
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('krew_token');
  localStorage.removeItem('krew_refresh_token');
};

// Keep for backwards compatibility
export const clearToken = clearTokens;

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

export const getAuthHeader = (): { Authorization?: string } => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Returns the active access token, preferring the Supabase session (new accounts)
// and falling back to the legacy krew_token (existing accounts). Use this for
// redirect flows (e.g. /auth/instagram) that pass the token as a query param,
// so Supabase-auth accounts don't send a null/legacy token.
export const getAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;
  return getToken();
};

// ── Logout ────────────────────────────────────────────────────────────────────
// Revokes the legacy refresh token on the server, clears localStorage, and
// signs out of Supabase so both session types are invalidated together.

export const logout = async (): Promise<void> => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://krew-ai-backend-production.up.railway.app';

  // Revoke legacy refresh token (fire-and-forget)
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }

  // Clear legacy tokens from localStorage
  clearTokens();

  // Sign out of Supabase Auth (clears its own localStorage entry)
  await supabase.auth.signOut().catch(() => {});

  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
};
