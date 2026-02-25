"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/ui/footer";
import { MainShell } from "@/components/main-shell";
import { Navbar } from "@/components/ui/navbar";

const HomeBgm = dynamic(() => import("@/components/home-bgm").then((mod) => mod.HomeBgm), {
  ssr: false
});

const MouseTrail = dynamic(() => import("@/components/mouse-trail").then((mod) => mod.MouseTrail), {
  ssr: false
});

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isDashboard = pathname.startsWith("/dashboard");

  if (isAdmin || isDashboard) {
    return (
      <div className="flex min-h-dvh flex-col">
        <HomeBgm />
        <MouseTrail />
        <MainShell>{children}</MainShell>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <HomeBgm />
      <MouseTrail />
      <Navbar />
      <MainShell>{children}</MainShell>
      <Footer />
    </div>
  );
}
