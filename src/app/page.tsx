import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { unstable_cache } from "next/cache";
import { getPosts, getTagsWithCount } from "@/features/blog/server/queries";
import { PostCard } from "@/features/blog/components/post-card";
import { Badge } from "@/components/ui/badge";
import { HeroTyping } from "@/components/hero-typing";
import { HomeLeftSidebar } from "@/components/home-left-sidebar";

export const revalidate = 120;

const getCachedHomeData = unstable_cache(
  async () => {
    const [postsResult, tags] = await Promise.all([
      getPosts({ pageSize: 12 }),
      getTagsWithCount()
    ]);
    return { posts: postsResult.items, total: postsResult.total, tags };
  },
  ["home-page-data"],
  { revalidate: 120, tags: ["home-page"] }
);

export default async function HomePage() {
  const { posts, total: postCount, tags } = await getCachedHomeData();

  const categoryCount = tags.length;

  return (
    <div className="relative space-y-0">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,20,20,0.18), rgba(20,20,20,0.24)), url('/images/home.jpg')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover"
        }}
      />

      <section className="relative -mt-16 ml-[calc(50%-50vw)] flex h-[100svh] w-screen items-center justify-center overflow-hidden">
        <HeroTyping />
        <a
          aria-label="Scroll to content"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/90 transition hover:text-white"
          href="#home-content"
        >
          <ChevronDown className="size-9" />
        </a>
      </section>

      <section
        className="ml-[calc(50%-50vw)] w-screen border-y border-white/45 bg-[linear-gradient(180deg,rgba(191,219,254,0.62)_0%,rgba(239,246,255,0.66)_30%,rgba(248,250,252,0.7)_58%,rgba(191,219,254,0.62)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_20px_45px_rgba(30,64,175,0.14)] backdrop-blur-[1px]"
        id="home-content"
      >
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-16 lg:grid-cols-[260px_minmax(0,1fr)]">
          <HomeLeftSidebar postCount={postCount} categoryCount={categoryCount} tagCount={tags.length} />

          <div>
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-h2 font-semibold">Featured Posts</h2>
                <Link className="text-sm text-primary hover:underline" href="/blog">
                  View all
                </Link>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {posts.slice(0, 3).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>

            <section className="mt-14 space-y-4">
              <h2 className="text-h2 font-semibold">Popular Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link href={`/blog?tag=${tag.slug}`} key={tag.id}>
                    <Badge className="hover:border-primary hover:text-primary">
                      {tag.name} ({tag.count})
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-14 space-y-4">
              <h2 className="text-h2 font-semibold">Latest Posts</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {posts.slice(0, 6).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
