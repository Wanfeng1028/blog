import type { Metadata } from "next";
import { AuthScene } from "@/components/auth/auth-scene";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "登录",
  description: "登录晚风博客。"
};

export default function LoginPage() {
  return (
    <AuthScene>
      <LoginForm />
    </AuthScene>
  );
}
