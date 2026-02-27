import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getArticleCategoriesWithCount, getPosts, getTagsWithCount } from "@/features/blog/server/queries";
import { PostCard } from "@/features/blog/components/post-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";
import { SearchBox } from "@/features/search/components/search-box";
import { cookies } from "next/headers";
import { getDictionary, type SupportedLang } from "@/features/i18n/get-dictionary";

type PageProps = {
  searchParams: Promise<{
    query?: string;
    tag?: string;
    category?: string;
    page?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
  const d = await getDictionary(lang);

  return {
    title: d.blog.title,
    description: d.blog.metaDescription,
    openGraph: {
      title: d.blog.title,
      description: d.blog.metaDescription,
      url: `${siteConfig.url}/blog`
    }
  };
}

export const revalidate = 120;

const getCachedBlogData = unstable_cache(
  async (query: string, tag: string, category: string, page: number) => {
    const [postsResult, tags, categories] = await Promise.all([
      getPosts({ query, tag, category, page, pageSize: 9 }),
      getTagsWithCount(),
      getArticleCategoriesWithCount()
    ]);
    return { postsResult, tags, categories };
  },
  ["blog-page-data"],
  { revalidate: 120, tags: ["blog-page"] }
);

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query?.trim() ?? "";
  const tag = params.tag?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const page = Number(params.page ?? "1");

  const { postsResult: { items, totalPages }, tags, categories } = await getCachedBlogData(query, tag, category, page);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
  const d = await getDictionary(lang);

  return (
    <div className="space-y-8">
      <header className="space-y-3 rounded-2xl border border-white/45 bg-white/26 px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.12)] backdrop-blur-[2px] dark:border-white/10 dark:bg-zinc-900/40 dark:shadow-none">
        <SearchBox initialKeyword={query} />
        <form action="/blog" className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            className="border-white/70 bg-white/62 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-400"
            defaultValue={query}
            name="query"
            placeholder={d.blog.searchPlaceholder}
          />
          <button className="h-10 rounded-md border border-zinc-900/80 bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800">
            {d.common.search}
          </button>
          {tag ? <input name="tag" type="hidden" value={tag} /> : null}
          {category ? <input name="category" type="hidden" value={category} /> : null}
        </form>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link href={`/blog${query ? `?query=${encodeURIComponent(query)}` : ""}`}>
          <Badge
            className={!category ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-white/60 bg-white/62 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300"}
          >
            {d.blog.allCategories}
          </Badge>
        </Link>
        {categories.map((item) => (
          <Link
            href={`/blog?category=${item.slug}${query ? `&query=${encodeURIComponent(query)}` : ""}${tag ? `&tag=${tag}` : ""}`}
            key={item.id}
          >
            <Badge
              className={
                category === item.slug
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-white/60 bg-white/62 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300"
              }
            >
              {item.name} ({item.count})
            </Badge>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/blog${category ? `?category=${category}` : ""}${query ? `${category ? "&" : "?"}query=${encodeURIComponent(query)}` : ""}`}>
          <Badge className={!tag ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-white/60 bg-white/62 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300"}>
            {d.blog.allTags}
          </Badge>
        </Link>
        {tags.map((item) => (
          <Link
            href={`/blog?tag=${item.slug}${query ? `&query=${encodeURIComponent(query)}` : ""}${category ? `&category=${category}` : ""}`}
            key={item.id}
          >
            <Badge
              className={
                tag === item.slug ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-white/60 bg-white/62 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300"
              }
            >
              {item.name} ({item.count})
            </Badge>
          </Link>
        ))}
      </div>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => {
            const current = index + 1;
            const href = `/blog?page=${current}${tag ? `&tag=${tag}` : ""}${category ? `&category=${category}` : ""}${query ? `&query=${encodeURIComponent(query)}` : ""}`;
            return (
              <Link
                className={`rounded-md border px-3 py-1 text-sm ${page === current ? "border-primary text-primary" : "border-border text-muted"}`}
                href={href}
                key={current}
              >
                {current}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
