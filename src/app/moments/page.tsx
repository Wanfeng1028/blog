import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site";
import { getDictionary, type SupportedLang } from "@/features/i18n/get-dictionary";
import { MomentsList } from "@/features/moments/components/moments-list";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
  const d = await getDictionary(lang);

  return {
    title: d.moments.title,
    description: "Wanfeng's Moments updates",
    openGraph: {
      title: d.moments.title,
      description: "Wanfeng's Moments updates",
      url: `${siteConfig.url}/moments`
    }
  };
}

export const revalidate = 60;

const getCachedMoments = unstable_cache(
  async () => {
    return db.moment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: { where: { status: "VISIBLE" } } } }
      }
    });
  },
  ["moments-list-first-page"],
  { revalidate: 60, tags: ["moments"] }
);

export default async function MomentsPage() {
  const moments = await getCachedMoments();

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <MomentsList
        initialMoments={moments.map((m) => ({
          id: m.id,
          content: m.content,
          images: m.images as string[] | null,
          createdAt: typeof m.createdAt === "string" ? m.createdAt : m.createdAt.toISOString(),
          user: m.user,
          commentCount: m._count.comments
        }))}
      />
    </div>
  );
}
