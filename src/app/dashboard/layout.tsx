import type { ReactNode } from "react";
import { UserShell } from "@/features/user/components/user-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <UserShell>{children}</UserShell>;
}
