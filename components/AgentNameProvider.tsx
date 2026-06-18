'use client';

import { createContext, useContext } from 'react';

// =============================================================================
// AGENT NAME — single source of truth (display only)
// =============================================================================
// This is the ONE place the UI reads the assistant's display name from.
// Right now it is a hardcoded default. There is intentionally NO save/persist
// logic, settings input, or API call here yet — this only centralizes the read
// so the name can be swapped in one place later.
//
// TODO(backend): replace default with agent name from store settings.
//   See AGENT_NAME_INTEGRATION.md for the full handoff (where to source the
//   value, validation, and the separate system-prompt task).
// =============================================================================
export const DEFAULT_AGENT_NAME = 'Luna';

const AgentNameContext = createContext<string>(DEFAULT_AGENT_NAME);

/** Read the current agent display name. Defaults to "Luna". */
export function useAgentName() {
  return useContext(AgentNameContext);
}

export function AgentNameProvider({
  children,
  name = DEFAULT_AGENT_NAME,
}: {
  children: React.ReactNode;
  name?: string;
}) {
  return (
    <AgentNameContext.Provider value={name}>
      {children}
    </AgentNameContext.Provider>
  );
}
