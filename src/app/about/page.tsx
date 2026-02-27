import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getSiteSettings } from "@/lib/site-settings";
import { cookies } from "next/headers";
import { getDictionary, type SupportedLang } from "@/features/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
  const d = await getDictionary(lang);

  return {
    title: d.about.title,
    description: d.about.metaDescription
  };
}

export const revalidate = 120;

const getCachedAboutData = unstable_cache(
  async () => {
    const settings = await getSiteSettings();
    return { settings };
  },
  ["about-page-data"],
  { revalidate: 120, tags: ["about-page"] }
);

export default async function AboutPage() {
  const { settings } = await getCachedAboutData();
  const aboutText = settings.aboutContent?.trim();

  const cookieStore = await cookies();
  const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
  const d = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-white/45 bg-white/65 p-6 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/40">
        <h1 className="text-h1 font-semibold">{d.about.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-muted">
          {aboutText || d.about.placeholder}
        </p>
      </section>
    </div>
  );
}
