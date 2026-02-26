import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownRenderer } from "@/lib/markdown/render";
import { absoluteUrl } from "@/lib/site";
import { getAdjacentPosts, getCommentsByPostSlug, getPostBySlug } from "@/features/blog/server/queries";
import { CommentSection } from "@/features/blog/components/comment-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostInteractionBar } from "@/features/user/components/post-interaction-bar";
import { PostViewTracker } from "@/features/user/components/post-view-tracker";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: "文章不存在"
    };
  }
  const url = absoluteUrl(`/blog/${post.slug}`);
  const ogImage = post.coverImage ?? absoluteUrl(`/og/post/${post.slug}`);
  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      url,
      type: "article",
      images: [{ url: ogImage }]
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [ogImage]
    }
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [adjacent, comments] = await Promise.all([
    getAdjacentPosts(post.slug),
    getCommentsByPostSlug(post.slug)
  ]);

  const shareUrl = absoluteUrl(`/blog/${post.slug}`);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.createdAt,
    author: {
      "@type": "Person",
      name: "Wanfeng"
    },
    url: shareUrl
  };

  return (
    <div>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd)
        }}
        type="application/ld+json"
      />
      <article className="space-y-6">
        <PostViewTracker postId={post.id} />

        <header className="space-y-3 rounded-2xl border border-white/45 bg-white/65 p-6 shadow-lg backdrop-blur-md">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <h1 className="text-h1 font-semibold">{post.title}</h1>
          <p className="text-muted">{post.summary}</p>
          <p className="text-sm text-muted">{post.readingTime} 分钟阅读</p>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`} rel="noreferrer" target="_blank">
                分享到 X
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} rel="noreferrer" target="_blank">
                分享到 LinkedIn
              </a>
            </Button>
          </div>
          <PostInteractionBar initialLikes={post.likesCount ?? 0} postId={post.id} />
        </header>

        <MarkdownRenderer content={post.content} />

        <nav className="grid gap-2 rounded-lg border border-white/40 bg-white/50 p-4 backdrop-blur-sm md:grid-cols-2">
          <div>
            <p className="text-xs text-muted">上一篇</p>
            {adjacent.previous ? (
              <Link className="text-sm hover:text-primary" href={`/blog/${adjacent.previous.slug}`}>
                {adjacent.previous.title}
              </Link>
            ) : (
              <p className="text-sm text-muted">没有了</p>
            )}
          </div>
          <div className="md:text-right">
            <p className="text-xs text-muted">下一篇</p>
            {adjacent.next ? (
              <Link className="text-sm hover:text-primary" href={`/blog/${adjacent.next.slug}`}>
                {adjacent.next.title}
              </Link>
            ) : (
              <p className="text-sm text-muted">没有了</p>
            )}
          </div>
        </nav>

        <CommentSection
          initialComments={comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            replies: (c.replies ?? []).map((r) => ({
              ...r,
              createdAt: r.createdAt.toISOString()
            }))
          }))}
          postId={post.id}
        />

      </article>
    </div>
  );
}
