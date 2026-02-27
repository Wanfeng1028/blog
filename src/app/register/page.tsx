import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { AuthScene } from "@/components/auth/auth-scene";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getDictionary } from "@/features/i18n/get-dictionary";
import type { SupportedLang } from "@/features/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
  const d = await getDictionary(lang);

  return {
    title: d.auth.registerTitle,
    description: d.auth.registerMetaDescription
  };
}

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
