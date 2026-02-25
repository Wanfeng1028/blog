"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import type { Session } from "next-auth";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { LangProvider } from "@/features/i18n/lang-context";
import type { ReactNode } from "react";

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
          {children}
          <Toaster position="top-right" richColors />
        </LangProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
