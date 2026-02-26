"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import type { Session } from "next-auth";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { LangProvider } from "@/features/i18n/lang-context";
import type { ReactNode } from "react";

import NextTopLoader from "nextjs-toploader";

export function Providers({
  children,
  session
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false} session={session}>
      <ThemeProvider>
        <LangProvider>
          <NextTopLoader
            color="#0ea5e9"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #0ea5e9,0 0 5px #0ea5e9"
          />
          {children}
          <Toaster position="top-right" richColors />
        </LangProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
