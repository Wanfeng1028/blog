"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PostPreview } from "@/features/blog/server/types";
import { useLang } from "@/features/i18n/lang-context";

export function PostCard({ post }: { post: PostPreview }) {
  const { lang, dictionary } = useLang();
  const d = dictionary!;

  return (
    <Card className="overflow-hidden">
      {post.coverImage && (
        <div className="relative aspect-[16/9]">
          <Image alt={post.title} className="object-cover" fill src={post.coverImage} />
        </div>
      )}
      <CardHeader>
        <p className="text-xs text-muted">
          {post.publishedAt ? format(post.publishedAt, "yyyy-MM-dd") : d.blog.notPublished} · {post.readingTime} {d.blog.minRead}
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
        <div className="mt-3 flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            {post.viewsCount ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="size-3.5" />
            {post.likesCount ?? 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
