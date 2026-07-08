'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';
import { ivyClient, IvyState } from '@/lib/ivy/ivyClient';

// Sibling of LunaGlobalProvider: subscribes the Ivy dashboard subtree to the
// ivyClient store. Components read state via useIvy() and mutate ONLY through
// ivyClient methods — keeping the future Supabase swap inside lib/ivy/ivyClient.ts.

const IvyContext = createContext<IvyState>(ivyClient.getState());

export function useIvy(): IvyState {
  return useContext(IvyContext);
}

export function IvyProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(ivyClient.subscribe, ivyClient.getState, ivyClient.getState);
  return <IvyContext.Provider value={state}>{children}</IvyContext.Provider>;
}
