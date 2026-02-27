"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Reply, Smile } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/features/i18n/lang-context";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type CommentUser = {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
};

type CommentItem = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: CommentUser;
  replies?: CommentItem[];
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.slice(0, 1).toUpperCase();
}

function timeAgo(dateStr: string, dict: any, lang: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return dict.blogPost.justNow;
  if (minutes < 60) return dict.blogPost.minutesAgo.replace("{n}", minutes.toString());
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return dict.blogPost.hoursAgo.replace("{n}", hours.toString());
  const days = Math.floor(hours / 24);
  if (days < 30) return dict.blogPost.daysAgo.replace("{n}", days.toString());
  return date.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US");
}

function CommentCard({
  comment,
  onReply,
  dict,
  lang
}: {
  comment: CommentItem;
  onReply: (parentId: string, parentName: string) => void;
  dict: any;
  lang: string;
}) {
  const user = comment.user;
  const displayName = user.name ?? dict.common.anonymous;
  const replies = comment.replies ?? [];

  return (
    <div>
      <div className="rounded-xl border border-white/50 bg-white/80 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/40">
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
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{displayName}</span>
              {user.email && (
                <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">{user.email}</span>
              )}
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{timeAgo(comment.createdAt, dict, lang)}</span>
            </div>

            {/* Content */}
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {comment.content}
            </p>

            {/* Reply button */}
            <button
              className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-violet-500 dark:text-zinc-500 dark:hover:text-violet-400"
              onClick={() => onReply(comment.id, displayName)}
              type="button"
            >
              <Reply className="size-3.5" />
              {dict.blogPost.reply}
            </button>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-violet-100 dark:border-violet-900/50 pl-4">
          {replies.map((reply) => (
            <CommentCard
              comment={reply}
              dict={dict}
              key={reply.id}
              lang={lang}
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
  momentId,
  initialComments
}: {
  postId?: string;
  momentId?: string;
  initialComments: CommentItem[];
}) {
  const { data: session } = useSession();
  const { lang, dictionary } = useLang();
  const d = dictionary!;
  const { resolvedTheme } = useTheme();
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadComments = async () => {
    const url = postId ? `/api/comments?postId=${postId}` : `/api/comments?momentId=${momentId}`;
    const response = await fetch(url, {
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
          ...(postId ? { postId } : {}),
          ...(momentId ? { momentId } : {}),
          parentId: replyTo?.id ?? null,
          content
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? d.blogPost.commentFail);
        return;
      }

      toast.success(replyTo ? d.blogPost.replySuccess : d.blogPost.commentSuccess);
      setContent("");
      setReplyTo(null);
      await loadComments();
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/45 bg-white/65 p-5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/40 dark:shadow-none">
      <div className="flex items-center gap-2">
        <MessageCircle className="size-5 text-violet-500 dark:text-violet-400" />
        <h3 className="text-lg font-semibold">{d.blogPost.comments}</h3>
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
          {d.blogPost.commentCount.replace("{n}", comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0).toString())}
        </span>
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 dark:border-violet-900/50 dark:bg-violet-900/20 dark:text-violet-300">
          <Reply className="size-4" />
          {d.blogPost.replyTo.replace("{name}", replyTo.name)}
          <button
            type="button"
            className="ml-auto text-xs text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-200"
            onClick={cancelReply}
          >
            {d.blogPost.cancel}
          </button>
        </div>
      )}

      {/* Form */}
      {session?.user ? (
        <div className="relative z-50 space-y-2 rounded-xl border border-white/40 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            {(session.user as any)?.image && (
              <img
                src={(session.user as any).image}
                alt=""
                className="size-6 rounded-full"
              />
            )}
            <span>{d.blogPost.commentAs.replace("{name}", session.user.name || d.common.anonymous)}</span>
          </div>
          <div className="relative">
            <Input
              id="comment-input"
              className="pr-10"
              onChange={(e) => setContent(e.target.value)}
              placeholder={replyTo ? d.blogPost.replyPlaceholder.replace("{name}", replyTo.name) : d.blogPost.commentPlaceholder}
              value={content}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="size-5" />
            </button>

            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute right-0 top-full z-[100] mt-2">
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setContent((prev) => prev + emojiData.emoji);
                  }}
                  theme={(resolvedTheme as any) === "dark" ? ("dark" as any) : ("light" as any)}
                />
              </div>
            )}
          </div>
          <Button loading={isPending} onClick={submitComment} type="button">
            {replyTo ? d.blogPost.submitReply : d.blogPost.submitComment}
          </Button>
        </div>
      ) : (
        <p className="rounded-lg border border-white/40 bg-white/60 p-3 text-sm text-zinc-500 backdrop-blur-sm">
          {d.blogPost.loginToComment}
        </p>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">{d.blogPost.noComments}</p>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              dict={d}
              lang={lang}
            />
          ))
        )}
      </div>
    </section>
  );
}
