import type { ReactNode } from "react";
import { AuthSnow } from "@/components/auth/auth-snow";

export function AuthScene({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden rounded-3xl border border-white/25 bg-slate-950/45">
      <div className="absolute inset-0 bg-[url('/images/home.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.35),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.2),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.6))]" />
      <AuthSnow />
      <div className="relative z-10 flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">{children}</div>
    </div>
  );
}

