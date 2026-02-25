import type { Metadata } from "next";
import Link from "next/link";
import { getArticleCategoriesWithCount, getPosts, getTagsWithCount } from "@/features/blog/server/queries";
import { PostCard } from "@/features/blog/components/post-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";
import { SearchBox } from "@/features/search/components/search-box";

type PageProps = {
  searchParams: Promise<{
    query?: string;
    tag?: string;
    category?: string;
    page?: string;
  }>;
};

export const revalidate = 60;

export const metadata: Metadata = {
  title: "博客",
  description: "浏览全部文章，按标签筛选并搜索内容。",
  openGraph: {
    title: "博客列表",
    description: "浏览全部文章，按标签筛选并搜索内容。",
    url: `${siteConfig.url}/blog`
  }
};

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query?.trim() ?? "";
  const tag = params.tag?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const page = Number(params.page ?? "1");

  const [{ items, totalPages }, tags, categories] = await Promise.all([
    getPosts({
      query,
      tag,
      category,
      page,
      pageSize: 9
    }),
    getTagsWithCount(),
    getArticleCategoriesWithCount()
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-3 rounded-2xl border border-white/45 bg-white/26 px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.12)] backdrop-blur-[2px]">
        <SearchBox initialKeyword={query} />
        <form action="/blog" className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            className="border-white/70 bg-white/62 text-zinc-900 placeholder:text-zinc-600"
            defaultValue={query}
            name="query"
            placeholder="搜索标题、摘要或正文..."
          />
          <button className="h-10 rounded-md border border-zinc-900/80 bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800">
            搜索
          </button>
          {tag ? <input name="tag" type="hidden" value={tag} /> : null}
          {category ? <input name="category" type="hidden" value={category} /> : null}
        </form>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link href={`/blog${query ? `?query=${encodeURIComponent(query)}` : ""}`}>
          <Badge
            className={!category ? "border-zinc-900 bg-zinc-900 text-white" : "border-white/60 bg-white/62 text-zinc-800"}
          >
            全部分类
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
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-white/60 bg-white/62 text-zinc-800"
              }
            >
              {item.name} ({item.count})
            </Badge>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/blog${category ? `?category=${category}` : ""}${query ? `${category ? "&" : "?"}query=${encodeURIComponent(query)}` : ""}`}>
          <Badge className={!tag ? "border-zinc-900 bg-zinc-900 text-white" : "border-white/60 bg-white/62 text-zinc-800"}>
            全部
          </Badge>
        </Link>
        {tags.map((item) => (
          <Link
            href={`/blog?tag=${item.slug}${query ? `&query=${encodeURIComponent(query)}` : ""}${category ? `&category=${category}` : ""}`}
            key={item.id}
          >
            <Badge
              className={
                tag === item.slug ? "border-zinc-900 bg-zinc-900 text-white" : "border-white/60 bg-white/62 text-zinc-800"
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
    </div>
  );
}
