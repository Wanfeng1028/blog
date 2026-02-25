"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

type State = {
  liked: boolean;
  favorited: boolean;
  likesCount: number;
};

type Props = {
  postId: string;
  initialLikes?: number;
};

export function PostInteractionBar({ postId, initialLikes = 0 }: Props) {
  const [state, setState] = useState<State>({
    liked: false,
    favorited: false,
    likesCount: initialLikes
  });
  const [likeLoading, setLikeLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // 防抖：500ms 内只允许触发一次
  const likeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [likeRes, favRes] = await Promise.all([
          fetch(`/api/blog/posts/${postId}/like`, { cache: "no-store" }),
          fetch(`/api/blog/posts/${postId}/favorite`, { cache: "no-store" })
        ]);
        const [likeJson, favJson] = await Promise.all([likeRes.json(), favRes.json()]);
        if (!active) return;
        setState((prev) => ({
          ...prev,
          liked: Boolean(likeJson?.data?.liked),
          likesCount: likeJson?.data?.likesCount ?? initialLikes,
          favorited: Boolean(favJson?.data?.favorited)
        }));
      } catch {
        // 静默失败，保留默认值
      }
    };
    void load();
    return () => { active = false; };
  }, [postId, initialLikes]);

  // ── 点赞（乐观更新 + 防抖 + 回滚） ──
  const handleLike = () => {
    if (likeLoading) return;
    if (likeDebounceRef.current) return; // 防连击

    // ① 乐观更新
    const prevState = state;
    setState((prev) => ({
      ...prev,
      liked: !prev.liked,
      likesCount: prev.liked ? Math.max(0, prev.likesCount - 1) : prev.likesCount + 1
    }));

    likeDebounceRef.current = setTimeout(() => {
      likeDebounceRef.current = null;
    }, 500);

    setLikeLoading(true);
    fetch(`/api/blog/posts/${postId}/like`, { method: "POST" })
      .then(async (res) => {
        const result = await res.json();
        if (!res.ok || !result.ok) {
          // ② 接口失败 → 回滚
          setState(prevState);
          if (res.status === 401) {
            toast.error("请先登录后再点赞");
          } else {
            toast.error(result.message ?? "操作失败，请稍后重试");
          }
          return;
        }
        // ③ 用服务端真实值同步（防止前后端不一致）
        setState((prev) => ({
          ...prev,
          liked: Boolean(result.data?.liked),
          likesCount: result.data?.likesCount ?? prev.likesCount
        }));
      })
      .catch(() => {
        setState(prevState);
        toast.error("网络异常，请稍后重试");
      })
      .finally(() => setLikeLoading(false));
  };

  // ── 收藏 ──
  const handleFavorite = async () => {
    if (favLoading) return;
    setFavLoading(true);
    try {
      const res = await fetch(`/api/blog/posts/${postId}/favorite`, { method: "POST" });
      let result: any = {};
      try { result = await res.json(); } catch { /* ignore */ }
      if (!res.ok || !result.ok) {
        toast.error(result.message ?? ("操作失败"));
        return;
      }
      setState((prev) => ({ ...prev, favorited: Boolean(result.data?.favorited) }));
      toast.success(result.data?.favorited ? "已收藏" : "已取消收藏");
    } catch {
      toast.error("操作失败，请稍后重试");
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 点赞按钮 */}
      <button
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
          state.liked
            ? "border-rose-300 bg-rose-50 text-rose-600"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-rose-300 hover:text-rose-500",
          likeLoading && "opacity-60 cursor-not-allowed"
        )}
        disabled={likeLoading}
        onClick={handleLike}
        type="button"
      >
        <Heart className={cn("size-4 transition-transform", state.liked ? "fill-current scale-110" : "")} />
        <span>{state.likesCount}</span>
      </button>

      {/* 收藏按钮 */}
      <button
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
          state.favorited
            ? "border-amber-300 bg-amber-50 text-amber-600"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-amber-300 hover:text-amber-500",
          favLoading && "opacity-60 cursor-not-allowed"
        )}
        disabled={favLoading}
        onClick={handleFavorite}
        type="button"
      >
        <Bookmark className={cn("size-4 transition-transform", state.favorited ? "fill-current scale-110" : "")} />
        <span>{state.favorited ? "已收藏" : "收藏"}</span>
      </button>
    </div>
  );
}
