'use client';

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { ivyClient, IvyState } from '@/lib/ivy/ivyClient';
import { getIvyBootstrap } from '@/lib/api';

// Sibling of LunaGlobalProvider: subscribes the Ivy dashboard subtree to the
// ivyClient store. Components read state via useIvy() and mutate ONLY through
// ivyClient methods — keeping the Supabase swap inside lib/ivy/ivyClient.ts.
//
// On mount we hydrate Capitals + Expenses from the backend bootstrap (the only
// tables wired to the API today). Revenue / inventory / target stay on their
// seed/dummy values until those endpoints land.

const IvyContext = createContext<IvyState>(ivyClient.getState());

export function useIvy(): IvyState {
  return useContext(IvyContext);
}

export function IvyProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(ivyClient.subscribe, ivyClient.getState, ivyClient.getState);

  useEffect(() => {
    let cancelled = false;
    getIvyBootstrap()
      .then((data) => {
        if (cancelled || !data) return;
        ivyClient.hydrate({
          capitals: data.capitals ?? [],
          expenses: data.expenses ?? [],
        });
      })
      .catch((err) => {
        // Keep the seed/dummy state so the dashboard still renders offline.
        console.error('[ivy] bootstrap load failed:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <IvyContext.Provider value={state}>{children}</IvyContext.Provider>;
}
