"use client";

import { useEffect, useState } from "react";
import { Eye, Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ProjectStatsProps = {
  slug: string;
  initialLikes: number;
  initialViews: number;
  interactive?: boolean;
};

export function ProjectStats({ slug, initialLikes, initialViews, interactive = false }: ProjectStatsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [views, setViews] = useState(initialViews);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!interactive) return;
    let active = true;

    const boot = async () => {
      try {
        const [likeRes, viewRes] = await Promise.all([
          fetch(`/api/projects/${slug}/like`, { cache: "no-store" }),
          fetch(`/api/projects/${slug}/view`, { method: "POST" })
        ]);

        if (!active) return;

        if (likeRes.ok) {
          const payload = await likeRes.json();
          if (payload?.ok) {
            setLiked(Boolean(payload.data?.liked));
            setLikes(Number(payload.data?.likesCount ?? initialLikes));
          }
        }

        if (viewRes.ok) {
          const payload = await viewRes.json();
          if (payload?.ok) {
            setViews(Number(payload.data?.viewsCount ?? initialViews));
          }
        }
      } catch {
        // no-op
      }
    };

    void boot();
    return () => {
      active = false;
    };
  }, [slug, interactive, initialLikes, initialViews]);

  const onToggleLike = async () => {
    if (loading || !interactive) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${slug}/like`, { method: "POST" });
      const payload = await response.json();
      if (response.ok && payload?.ok) {
        setLiked(Boolean(payload.data?.liked));
        setLikes(Number(payload.data?.likesCount ?? likes));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-600">
      <button
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 transition",
          interactive ? "hover:border-rose-300 hover:text-rose-600" : "cursor-default",
          liked ? "border-rose-300 text-rose-600" : ""
        )}
        disabled={!interactive || loading}
        onClick={onToggleLike}
        type="button"
      >
        <Heart className={cn("size-3.5", liked ? "fill-current" : "")} />
        {likes}
      </button>
      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1">
        <Eye className="size-3.5" />
        {views}
      </span>
    </div>
  );
}
