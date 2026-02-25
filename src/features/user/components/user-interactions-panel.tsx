"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

type FavoriteRow = {
  id: string;
  createdAt: string;
  post: { id: string; title: string; slug: string; summary: string };
};

type LikeRow = {
  id: string;
  createdAt: string;
  post: { id: string; title: string; slug: string; summary: string };
};

type CommentRow = {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  post: { title: string; slug: string };
};

type Props = {
  favorites: FavoriteRow[];
  likes: LikeRow[];
  comments: CommentRow[];
};

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "已通过",
  PENDING: "审核中",
  REJECTED: "已拒绝"
};
const STATUS_COLOR: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700"
};

const TABS = [
  { key: "favorites", label: "我的收藏", icon: Bookmark },
  { key: "likes",     label: "我的点赞", icon: Heart },
  { key: "comments",  label: "我的评论", icon: MessageSquare }
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function UserInteractionsPanel({ favorites, likes, comments }: Props) {
  const [tab, setTab] = useState<TabKey>("favorites");
  const [favoriteRows, setFavoriteRows] = useState(favorites);
  const [likeRows, setLikeRows] = useState(likes);

  const removeFavorite = async (postId: string) => {
    const res = await fetch("/api/user/interactions/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId })
    });
    const result = await res.json();
    if (!res.ok || !result.ok) { toast.error(result.message ?? "取消收藏失败"); return; }
    setFavoriteRows((prev) => prev.filter((r) => r.post.id !== postId));
    toast.success("已取消收藏");
  };

  const removeLike = async (postId: string) => {
    const res = await fetch("/api/user/interactions/likes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId })
    });
    const result = await res.json();
    if (!res.ok || !result.ok) { toast.error(result.message ?? "取消点赞失败"); return; }
    setLikeRows((prev) => prev.filter((r) => r.post.id !== postId));
    toast.success("已取消点赞");
  };

  const counts: Record<TabKey, number> = {
    favorites: favoriteRows.length,
    likes: likeRows.length,
    comments: comments.length
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      {/* Tab 切换 */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted/30 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition",
              tab === key
                ? "bg-white text-foreground shadow-sm dark:bg-zinc-800"
                : "text-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* 收藏列表 */}
      {tab === "favorites" && (
        <InteractionList
          rows={favoriteRows}
          emptyText="还没有收藏过文章"
          timeLabel="收藏时间"
          actionLabel="取消收藏"
          onRemove={removeFavorite}
        />
      )}

      {/* 点赞列表 */}
      {tab === "likes" && (
        <InteractionList
          rows={likeRows}
          emptyText="还没有点赞过文章"
          timeLabel="点赞时间"
          actionLabel="取消点赞"
          onRemove={removeLike}
        />
      )}

      {/* 评论列表 */}
      {tab === "comments" && (
        comments.length === 0 ? (
          <Empty text="还没有发表过评论" />
        ) : (
          <ul className="divide-y divide-border">
            {comments.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-start sm:gap-4">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <Link
                    href={`/blog/${item.post.slug}`}
                    className="text-sm font-medium text-muted hover:text-primary"
                  >
                    {item.post.title}
                  </Link>
                  <p className="line-clamp-2 text-sm text-foreground">{item.content}</p>
                  <p className="text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <span className={cn(
                  "mt-1 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium sm:mt-0",
                  STATUS_COLOR[item.status] ?? "bg-zinc-100 text-zinc-600"
                )}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </span>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

type InteractionListProps = {
  rows: Array<{ id: string; createdAt: string; post: { id: string; title: string; slug: string; summary: string } }>;
  emptyText: string;
  timeLabel: string;
  actionLabel: string;
  onRemove: (postId: string) => void;
};

function InteractionList({ rows, emptyText, timeLabel, actionLabel, onRemove }: InteractionListProps) {
  if (rows.length === 0) return <Empty text={emptyText} />;
  return (
    <ul className="divide-y divide-border">
      {rows.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-4 py-4">
          <div className="min-w-0 flex-1 space-y-0.5">
            <Link href={`/blog/${item.post.slug}`} className="text-sm font-medium hover:text-primary">
              {item.post.title}
            </Link>
            <p className="line-clamp-1 text-xs text-muted">{item.post.summary}</p>
            <p className="text-xs text-muted">{timeLabel}：{new Date(item.createdAt).toLocaleString()}</p>
          </div>
          <button
            onClick={() => onRemove(item.post.id)}
            className="shrink-0 rounded-md border border-rose-200 px-2.5 py-1 text-xs text-rose-600 transition hover:bg-rose-50"
          >
            {actionLabel}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-12 text-center text-sm text-muted">{text}</p>;
}
