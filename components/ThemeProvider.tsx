'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Marketing/public pages are dark-only (the theme toggle was removed from
    // the marketing nav). Only the agent dashboards honour the stored
    // light/dark preference.
    const isDashboard = pathname?.startsWith('/dashboard') ?? false;
    const next: Theme = isDashboard
      ? ((localStorage.getItem('theme') as Theme) || 'light')
      : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  }, [pathname]);

  // Only reachable from the dashboard shells (IvyTopBarActions / LunaTopBarActions).
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}