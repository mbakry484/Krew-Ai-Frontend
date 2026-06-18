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
        {/* Blocking script: reads localStorage and sets data-theme before first paint
            — prevents dark/light flash on load. Must be synchronous (no defer/async). */}
        <script dangerouslySetInnerHTML={{ __html:
          `try{document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||'light')}catch(e){document.documentElement.setAttribute('data-theme','light')}`
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