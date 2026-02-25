import type { Metadata } from "next";
import { AuthScene } from "@/components/auth/auth-scene";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "忘记密码",
  description: "通过邮箱验证码重置密码。"
};

export default function ForgotPasswordPage() {
  return (
    <AuthScene>
      <ForgotPasswordForm />
    </AuthScene>
  );
}
