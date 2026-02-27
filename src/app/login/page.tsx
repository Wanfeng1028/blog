import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AuthScene } from "@/components/auth/auth-scene";
import { LoginForm } from "@/features/auth/components/login-form";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { SupportedLang } from "@/features/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
  const d = await getDictionary(lang);

  return {
    title: d.auth.loginTitle,
    description: d.auth.loginMetaDescription
  };
}

export default function LoginPage() {
  return (
    <AuthScene>
      <LoginForm />
    </AuthScene>
  );
}
