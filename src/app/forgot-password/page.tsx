import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AuthScene } from "@/components/auth/auth-scene";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { SupportedLang } from "@/features/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
  const d = await getDictionary(lang);

  return {
    title: d.auth.forgotTitle,
    description: d.auth.forgotMetaDescription
  };
}

export default function ForgotPasswordPage() {
  return (
    <AuthScene>
      <ForgotPasswordForm />
    </AuthScene>
  );
}
