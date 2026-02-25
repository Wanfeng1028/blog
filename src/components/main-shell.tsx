"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const isAppPanel = isAdmin || isDashboard;
  const showHalfHome = !isHome && !isAppPanel;

  return (
    <main className={cn("relative w-full flex-1", isAppPanel ? "px-0 pt-0" : "px-4 pt-16", showHalfHome && "site-page-surface")}>
      {showHalfHome ? (
        <section className="relative flex h-[50svh] items-center justify-center text-center">
          <div className="rounded-2xl border border-white/25 bg-black/15 px-6 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-[1px]">
            <div className="text-center text-white">
              <h1 className="font-serif text-5xl font-semibold tracking-wide md:text-7xl">Wanfeng&apos;s home</h1>
              <p className="mt-6 bg-gradient-to-r from-violet-300 via-indigo-300 to-pink-300 bg-clip-text text-xl text-transparent md:text-3xl">
                Life is coding, I will debug it.
              </p>
            </div>
          </div>
        </section>
      ) : null}
      <div className={cn("w-full", !isAppPanel && !isAuthPage && "container mx-auto")}>{children}</div>
    </main>
  );
}
