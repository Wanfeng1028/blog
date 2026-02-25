import type { Metadata } from "next";
import { AuthScene } from "@/components/auth/auth-scene";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "重置密码",
  description: "输入邮箱验证码并设置新密码。"
};

export default function ResetPasswordPage() {
  return (
    <AuthScene>
      <ResetPasswordForm />
    </AuthScene>
  );
}
