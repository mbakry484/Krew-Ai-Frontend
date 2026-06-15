'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getLunaGlobalStatus, updateLunaGlobalStatus } from '@/lib/api';

interface LunaGlobalContextType {
  lunaGlobalEnabled: boolean;
  lunaGlobalLoading: boolean;
  toggleLunaGlobal: () => Promise<void>;
}

const LunaGlobalContext = createContext<LunaGlobalContextType>({
  lunaGlobalEnabled: true,
  lunaGlobalLoading: true,
  toggleLunaGlobal: async () => {},
});

export function useLunaGlobal() {
  return useContext(LunaGlobalContext);
}

export function LunaGlobalProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLunaGlobalStatus()
      .then((res) => {
        setEnabled(res.luna_global_enabled ?? true);
      })
      .catch(() => {
        // Default to enabled if fetch fails
        setEnabled(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleLunaGlobal = useCallback(async () => {
    const newValue = !enabled;
    setEnabled(newValue); // Optimistic
    try {
      await updateLunaGlobalStatus(newValue);
    } catch {
      setEnabled(!newValue); // Revert on failure
    }
  }, [enabled]);

  return (
    <LunaGlobalContext.Provider value={{ lunaGlobalEnabled: enabled, lunaGlobalLoading: loading, toggleLunaGlobal }}>
      {children}
    </LunaGlobalContext.Provider>
  );
}
