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
            1. reads localStorage → sets data-theme before first paint (no flash)
            2. disables the browser's scroll restoration so a reload always
               lands at the top instead of wherever you last were. Anchor
               links + programmatic scroll are unaffected. */}
        <script dangerouslySetInnerHTML={{ __html:
          `try{document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||'light')}catch(e){document.documentElement.setAttribute('data-theme','light')}` +
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