import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AuthScene } from "@/components/auth/auth-scene";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { SupportedLang } from "@/features/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
  const d = await getDictionary(lang);

  return {
    title: d.auth.resetTitle,
    description: d.auth.resetMetaDescription
  };
}

export default function ResetPasswordPage() {
  return (
    <AuthScene>
      <ResetPasswordForm />
    </AuthScene>
  );
}
