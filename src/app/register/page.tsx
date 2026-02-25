import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthScene } from "@/components/auth/auth-scene";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "注册",
  description: "注册晚风博客账号。"
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/blog");
  }
  return (
    <AuthScene>
      <RegisterForm />
    </AuthScene>
  );
}
