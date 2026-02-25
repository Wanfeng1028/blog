"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils/cn";
import { SubPageTyping } from "@/components/sub-page-typing";

// 动态 import 避免首屏 SSR 时携带 usePathname 判断
const GlobalSidebar = dynamic(
  () => import("@/components/global-sidebar").then((m) => m.GlobalSidebar),
  { ssr: false }
);

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
  // 在以下页面不显示全局侧边栏：首页（有自己的侧边栏）、admin、dashboard、auth、forbidden、security
  const showGlobalSidebar =
    !isHome &&
    !isAppPanel &&
    !isAuthPage &&
    !pathname.startsWith("/forbidden") &&
    !pathname.startsWith("/security");

  return (
    <main className={cn("relative w-full flex-1", isAppPanel ? "px-0 pt-0" : "px-4 pt-16", showHalfHome && "site-page-surface")}>
      {showHalfHome ? (
        <section className="relative flex h-[50svh] items-center justify-center text-center">
          <div className="rounded-2xl border border-white/25 bg-black/15 px-6 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-[1px]">
            <SubPageTyping />
          </div>
        </section>
      ) : null}
      <div className={cn("w-full", !isAppPanel && !isAuthPage && "mx-auto w-full max-w-[1440px]")}>
        {showGlobalSidebar ? (
          <div className="flex gap-6 lg:gap-8">
            <GlobalSidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </main>
  );
}
