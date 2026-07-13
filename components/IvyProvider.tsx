'use client';

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { ivyClient, IvyState } from '@/lib/ivy/ivyClient';
import { getIvyBootstrap } from '@/lib/api';

// Sibling of LunaGlobalProvider: subscribes the Ivy dashboard subtree to the
// ivyClient store. Components read state via useIvy() and mutate ONLY through
// ivyClient methods — keeping the Supabase swap inside lib/ivy/ivyClient.ts.
//
// On mount we hydrate Capitals + Expenses from the backend bootstrap, then the
// profit/inventory layer (products, alerts, preferences, onboarding status,
// real P&L overviews). Revenue / inventory / target stay on their seed/dummy
// values until those endpoints land.

const IvyContext = createContext<IvyState>(ivyClient.getState());

export function useIvy(): IvyState {
  return useContext(IvyContext);
}

export function IvyProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(ivyClient.subscribe, ivyClient.getState, ivyClient.getState);

  useEffect(() => {
    // Restore onboarding state. localStorage is the fast path; the DATABASE
    // (brands.ivy_onboarding_completed) is the source of truth, so a user who
    // cleared their storage never sees the first-open flow again. Async — the
    // overlay stays closed (hydrated=false) until this resolves.
    ivyClient.hydrateOnboarding().catch((err) => {
      console.error('[ivy] onboarding hydrate failed:', err);
    });
  }, []);

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

    // Products, alerts, preferences, onboarding status, and the real P&L
    // overviews. Independent of the bootstrap — each slice fails soft inside.
    ivyClient.hydrateIntelligence().catch((err) => {
      console.error('[ivy] intelligence load failed:', err);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return <IvyContext.Provider value={state}>{children}</IvyContext.Provider>;
}
