// JWT token management and authentication helpers

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

// Logout: revoke refresh token on server then clear local storage
export const logout = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://krew-ai-backend-production.up.railway.app';
    // Fire-and-forget — don't block logout on network failure
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
};
