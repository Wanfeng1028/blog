"use client";

import { useState } from "react";
import { MessageCircle, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CommentSection } from "@/features/blog/components/comment-section";
import { useLang } from "@/features/i18n/lang-context";
import { cn } from "@/lib/utils/cn";

type MomentUser = {
  id: string;
  name: string | null;
  image: string | null;
};

export type MomentItemDTO = {
  id: string;
  content: string;
  images: string[] | null;
  createdAt: string;
  user: MomentUser;
  commentCount: number;
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

function MomentCard({ item, dict, lang }: { item: MomentItemDTO; dict: any; lang: string }) {
  const [showComments, setShowComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  const handleToggleComments = async () => {
    if (!showComments && !commentsLoaded) {
      setShowComments(true);
      try {
        const res = await fetch(`/api/comments?momentId=${item.id}`);
        const result = await res.json();
        if (res.ok && result.ok) {
          setComments(result.data);
          setCommentsLoaded(true);
        }
      } catch (e) {
        console.error("Failed to fetch comments", e);
      }
    } else {
      setShowComments(!showComments);
    }
  };

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        // 透明毛玻璃卡片
        "border border-white/40 bg-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.06)]",
        "backdrop-blur-xl backdrop-saturate-150",
        // dark mode
        "dark:border-white/[0.06] dark:bg-zinc-900/30 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        // hover
        "transition-all duration-300",
        "hover:border-white/60 hover:bg-white/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]",
        "dark:hover:border-white/10 dark:hover:bg-zinc-900/50"
      )}
    >
      {/* 顶部渐变装饰条 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-400/60 via-indigo-400/60 to-cyan-400/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {item.user.image ? (
            <img
              src={item.user.image}
              alt={item.user.name || "User"}
              className="size-11 shrink-0 rounded-full border-2 border-white/50 object-cover shadow-sm ring-1 ring-black/5 dark:border-zinc-700/60 dark:ring-white/5"
            />
          ) : (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-lg font-semibold text-white shadow-sm ring-2 ring-white/50 dark:ring-zinc-700/60">
              {getInitials(item.user.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* 用户名 + 时间 */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                {item.user.name || dict.common.anonymous}
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500" suppressHydrationWarning>
                {timeAgo(item.createdAt, dict, lang)}
              </span>
            </div>

            {/* Markdown 内容 */}
            <div className="prose prose-sm prose-zinc mt-2.5 max-w-none dark:prose-invert prose-headings:font-bold prose-p:leading-relaxed prose-pre:rounded-xl prose-pre:border prose-pre:border-zinc-800/80 prose-pre:bg-zinc-900/95 dark:prose-pre:border-white/10 dark:prose-pre:bg-black/50 prose-pre:text-zinc-100 prose-pre:shadow-inner prose-blockquote:border-l-violet-400/60 prose-blockquote:text-zinc-600 dark:prose-blockquote:text-zinc-400 prose-img:rounded-xl">
              <ReactMarkdown>{item.content}</ReactMarkdown>
            </div>

            {/* 图片网格 */}
            {item.images && item.images.length > 0 && (
              <div
                className={cn(
                  "mt-3.5 grid gap-2",
                  item.images.length === 1 ? "grid-cols-1 md:w-3/4" : item.images.length === 2 ? "grid-cols-2" : "grid-cols-3"
                )}
              >
                {item.images.map((img, idx) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "relative block overflow-hidden rounded-xl border border-white/40 dark:border-zinc-800/60",
                      item.images!.length === 1 ? "aspect-video" : "aspect-square"
                    )}
                  >
                    <img
                      src={img}
                      alt=""
                      className="absolute inset-0 h-full w-full bg-zinc-100 object-cover transition-transform duration-500 hover:scale-105 dark:bg-zinc-800"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}

            {/* 评论按钮 */}
            <div className="mt-4 flex items-center">
              <button
                onClick={handleToggleComments}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                  showComments
                    ? "bg-violet-500/15 text-violet-600 ring-1 ring-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/20"
                    : "bg-white/50 text-zinc-500 ring-1 ring-zinc-200/60 hover:bg-violet-50 hover:text-violet-600 hover:ring-violet-200/60 dark:bg-zinc-800/50 dark:text-zinc-400 dark:ring-zinc-700/60 dark:hover:bg-violet-900/20 dark:hover:text-violet-300"
                )}
              >
                <MessageCircle className="size-3.5" />
                {item.commentCount > 0 ? `${item.commentCount} ${dict.blogPost.reply}` : dict.blogPost.reply}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 评论区 */}
      {showComments && (
        <div className="mx-5 mb-5 mt-0 rounded-xl border border-white/30 bg-white/20 p-4 backdrop-blur-md dark:border-white/5 dark:bg-zinc-900/20 sm:mx-6 sm:mb-6">
          {!commentsLoaded ? (
            <div className="py-4 text-center text-sm text-zinc-400">
              <span className="inline-block animate-pulse">{dict.common.loading}</span>
            </div>
          ) : (
            <CommentSection momentId={item.id} initialComments={comments} />
          )}
        </div>
      )}
    </article>
  );
}

export function MomentsList({ initialMoments }: { initialMoments: MomentItemDTO[] }) {
  const { lang, dictionary: dict } = useLang();

  if (!dict) return null;

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="mb-6 text-center">
        <h1 className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-violet-400 dark:via-indigo-400 dark:to-cyan-400">
          {dict.moments.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500/80 dark:text-zinc-400/60">
          {lang === "zh" ? "记录生活的点滴碎片" : "Record the bits and pieces of life."}
        </p>
      </div>

      {/* 碎碎念列表 */}
      <div className="space-y-5">
        {initialMoments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/30 bg-white/20 py-20 backdrop-blur-xl dark:border-white/5 dark:bg-zinc-900/20">
            <ImageIcon className="mb-4 size-12 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              {lang === "zh" ? "还没有发表碎碎念" : "No moments published yet."}
            </p>
          </div>
        ) : (
          initialMoments.map((item) => <MomentCard key={item.id} item={item} dict={dict} lang={lang} />)
        )}
      </div>
    </div>
  );
}
