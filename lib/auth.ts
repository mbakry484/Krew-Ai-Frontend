// JWT token management and authentication helpers

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('krew_token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('krew_token', token);
};

export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('krew_token');
};

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

export const getAuthHeader = (): { Authorization?: string } => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Logout function
export const logout = (): void => {
  clearToken();
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
};