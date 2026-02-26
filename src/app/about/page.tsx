import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "关于我",
  description: "个人介绍"
};

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-white/45 bg-white/65 p-6 backdrop-blur-md">
        <h1 className="text-h1 font-semibold">关于我</h1>
        <p className="mt-3 whitespace-pre-wrap text-muted">
          {aboutText || "这里是关于我页面占位内容。你可以在后台 -> 站点设置中编辑并实时生效。"}
        </p>
      </section>
    </div>
  );
}
