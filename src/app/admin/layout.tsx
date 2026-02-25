import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default async function AdminLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
