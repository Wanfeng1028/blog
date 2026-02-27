"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/features/i18n/lang-context";

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

const STATUS_COLOR: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700"
};

const getTabs = (dict: any) => [
  { key: "favorites", label: dict.userDashboard.myFavorites, icon: Bookmark },
  { key: "likes", label: dict.userDashboard.myLikes, icon: Heart },
  { key: "comments", label: dict.userDashboard.myComments, icon: MessageSquare }
] as const;

type TabKey = "favorites" | "likes" | "comments";

export function UserInteractionsPanel({ favorites, likes, comments }: Props) {
  const { lang, dictionary } = useLang();
  const dict = dictionary!;
  const TABS = getTabs(dict);
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
    if (!res.ok || !result.ok) { toast.error(result.message ?? dict.userDashboard.cancelFavoriteFail); return; }
    setFavoriteRows((prev) => prev.filter((r) => r.post.id !== postId));
    toast.success(dict.userDashboard.cancelFavoriteSuccess);
  };

  const removeLike = async (postId: string) => {
    const res = await fetch("/api/user/interactions/likes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId })
    });
    const result = await res.json();
    if (!res.ok || !result.ok) { toast.error(result.message ?? dict.userDashboard.cancelLikeFail); return; }
    setLikeRows((prev) => prev.filter((r) => r.post.id !== postId));
    toast.success(dict.userDashboard.cancelLikeSuccess);
  };

  const counts: Record<TabKey, number> = {
    favorites: favoriteRows.length,
    likes: likeRows.length,
    comments: comments.length
  };

  return (
    <div className="wanfeng-user-panel p-6">
      {/* Tab 切换 */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100/60 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition",
              tab === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Icon className="size-4" />
            {label}
            <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* 收藏列表 */}
      {tab === "favorites" && (
        <InteractionList
          rows={favoriteRows}
          emptyText={dict.userDashboard.emptyFavorites}
          timeLabel={dict.userDashboard.favoriteTime}
          actionLabel={dict.userDashboard.cancelFavorite}
          onRemove={removeFavorite}
          lang={lang}
        />
      )}

      {/* 点赞列表 */}
      {tab === "likes" && (
        <InteractionList
          rows={likeRows}
          emptyText={dict.userDashboard.emptyLikes}
          timeLabel={dict.userDashboard.likeTime}
          actionLabel={dict.userDashboard.cancelLike}
          onRemove={removeLike}
          lang={lang}
        />
      )}

      {/* 评论列表 */}
      {tab === "comments" && (
        comments.length === 0 ? (
          <Empty text={dict.userDashboard.emptyComments} />
        ) : (
          <ul className="divide-y divide-slate-200/60">
            {comments.map((item) => {
              let statusLabel = item.status;
              if (item.status === "APPROVED") statusLabel = dict.userDashboard.statusApproved;
              if (item.status === "PENDING") statusLabel = dict.userDashboard.statusPending;
              if (item.status === "REJECTED") statusLabel = dict.userDashboard.statusRejected;

              return (
                <li key={item.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-start sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <Link
                      href={`/blog/${item.post.slug}`}
                      className="text-sm font-medium text-slate-600 hover:text-blue-600"
                    >
                      {item.post.title}
                    </Link>
                    <p className="line-clamp-2 text-sm text-slate-800">{item.content}</p>
                    <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}</p>
                  </div>
                  <span className={cn(
                    "mt-1 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium sm:mt-0",
                    STATUS_COLOR[item.status] ?? "bg-slate-100 text-slate-600"
                  )}>
                    {statusLabel}
                  </span>
                </li>
              );
            })}
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
  lang: string;
};

function InteractionList({ rows, emptyText, timeLabel, actionLabel, onRemove, lang }: InteractionListProps) {
  if (rows.length === 0) return <Empty text={emptyText} />;
  return (
    <ul className="divide-y divide-slate-200/60">
      {rows.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-4 py-4">
          <div className="min-w-0 flex-1 space-y-0.5">
            <Link href={`/blog/${item.post.slug}`} className="text-sm font-medium text-slate-800 hover:text-blue-600">
              {item.post.title}
            </Link>
            <p className="line-clamp-1 text-xs text-slate-500">{item.post.summary}</p>
            <p className="text-xs text-slate-400">{timeLabel}：{new Date(item.createdAt).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}</p>
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
  return <p className="py-12 text-center text-sm text-slate-500">{text}</p>;
}
