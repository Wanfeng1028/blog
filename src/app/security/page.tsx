import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeviceManagement } from "@/features/auth/components/device-management";

export const metadata: Metadata = {
  title: "账号安全",
  description: "管理登录设备与账号安全。"
};

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/security");
  }
  return (
    <div className="mx-auto max-w-3xl py-10">
      <DeviceManagement />
    </div>
  );
}
