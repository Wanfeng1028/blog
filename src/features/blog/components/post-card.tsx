import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PostPreview } from "@/features/blog/server/types";

export function PostCard({ post }: { post: PostPreview }) {
  return (
    <Card className="overflow-hidden">
      {post.coverImage && (
        <div className="relative aspect-[16/9]">
          <Image alt={post.title} className="object-cover" fill src={post.coverImage} />
        </div>
      )}
      <CardHeader>
        <p className="text-xs text-muted">
          {post.publishedAt ? format(post.publishedAt, "yyyy-MM-dd") : "未发布"} · {post.readingTime} min read
        </p>
        <Link className="text-xl font-semibold hover:text-primary" href={`/blog/${post.slug}`}>
          {post.title}
        </Link>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted">{post.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
