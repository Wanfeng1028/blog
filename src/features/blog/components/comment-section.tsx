"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Reply } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CommentUser = {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
};

type ReplyItem = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: CommentUser;
};

type CommentItem = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: CommentUser;
  replies?: ReplyItem[];
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.slice(0, 1).toUpperCase();
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return date.toLocaleDateString("zh-CN");
}

function CommentCard({
  comment,
  onReply,
  replies = []
}: {
  comment: CommentItem | ReplyItem;
  onReply: (parentId: string, parentName: string) => void;
  replies?: ReplyItem[];
}) {
  const user = comment.user;
  const displayName = user.name ?? "匿名用户";

  return (
    <div>
      <div className="rounded-xl border border-white/50 bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {user.image ? (
            <img
              src={user.image}
              alt={displayName}
              className="size-9 shrink-0 rounded-full border border-white/60 object-cover shadow-sm"
            />
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-sm font-semibold text-white shadow-sm">
              {getInitials(user.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-zinc-800">{displayName}</span>
              {user.email && (
                <span className="truncate text-xs text-zinc-400">{user.email}</span>
              )}
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-400">{timeAgo(comment.createdAt)}</span>
            </div>

            {/* Content */}
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {comment.content}
            </p>

            {/* Reply button */}
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-violet-500"
              onClick={() => onReply(comment.id, displayName)}
            >
              <Reply className="size-3.5" />
              回复
            </button>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-violet-100 pl-4">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({
  postId,
  initialComments
}: {
  postId: string;
  initialComments: CommentItem[];
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const loadComments = async () => {
    const response = await fetch(`/api/comments?postId=${postId}`, {
      cache: "no-store"
    });
    const result = await response.json();
    if (response.ok && result.ok) {
      setComments(result.data);
    }
  };

  const handleReply = (parentId: string, parentName: string) => {
    setReplyTo({ id: parentId, name: parentName });
    document.getElementById("comment-input")?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const submitComment = () => {
    if (!content.trim()) return;
    startTransition(async () => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          parentId: replyTo?.id ?? null,
          content
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "评论失败");
        return;
      }

      toast.success(replyTo ? "回复成功" : "评论成功");
      setContent("");
      setReplyTo(null);
      await loadComments();
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/45 bg-white/65 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2">
        <MessageCircle className="size-5 text-violet-500" />
        <h3 className="text-lg font-semibold">评论</h3>
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-600">
          {comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)} 条
        </span>
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700">
          <Reply className="size-4" />
          回复 <span className="font-semibold">{replyTo.name}</span>
          <button
            type="button"
            className="ml-auto text-xs text-violet-500 hover:text-violet-700"
            onClick={cancelReply}
          >
            取消
          </button>
        </div>
      )}

      {/* Form */}
      {session?.user ? (
        <div className="space-y-2 rounded-xl border border-white/40 bg-white/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            {(session.user as any)?.image && (
              <img
                src={(session.user as any).image}
                alt=""
                className="size-6 rounded-full"
              />
            )}
            <span>以 <strong>{session.user.name}</strong> 身份评论</span>
          </div>
          <Input
            id="comment-input"
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? `回复 ${replyTo.name}...` : "写下你的评论..."}
            value={content}
          />
          <Button loading={isPending} onClick={submitComment} type="button">
            {replyTo ? "发表回复" : "提交评论"}
          </Button>
        </div>
      ) : (
        <p className="rounded-lg border border-white/40 bg-white/60 p-3 text-sm text-zinc-500 backdrop-blur-sm">
          登录后可以发表评论。
        </p>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">还没有评论，来发表第一条吧 ✨</p>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              replies={comment.replies}
            />
          ))
        )}
      </div>
    </section>
  );
}
