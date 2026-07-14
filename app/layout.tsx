import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AgentNameProvider } from "@/components/AgentNameProvider";
import ConditionalNavigation from "@/components/ConditionalNavigation";

export const metadata: Metadata = {
  title: "Krew — AI Operations",
  description: "AI-powered customer service automation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking script (must be synchronous — no defer/async):
            1. sets data-theme before first paint (no flash). Marketing/public
               pages are dark-only; only /dashboard/* honours the stored pref.
            2. disables the browser's scroll restoration so a reload always
               lands at the top instead of wherever you last were. Anchor
               links + programmatic scroll are unaffected. */}
        <script dangerouslySetInnerHTML={{ __html:
          `try{var p=location.pathname,d=p.indexOf('/dashboard')===0;document.documentElement.setAttribute('data-theme',d?(localStorage.getItem('theme')||'light'):'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}` +
          `try{if('scrollRestoration' in history){history.scrollRestoration='manual'}}catch(e){}`
        }} />
      </head>
      <body>
        <ThemeProvider>
          <AgentNameProvider>
            <Suspense fallback={null}>
              <ConditionalNavigation />
            </Suspense>
            {children}
          </AgentNameProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}