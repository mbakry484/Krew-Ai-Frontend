'use client';

import { LunaGlobalProvider } from '@/components/LunaGlobalProvider';

export default function LunaLayout({ children }: { children: React.ReactNode }) {
  return <LunaGlobalProvider>{children}</LunaGlobalProvider>;
}
