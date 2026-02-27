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

type MessageItem = {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  content: string;
  parentId: string | null;
  status: "VISIBLE" | "HIDDEN" | "DELETED" | "PENDING";
  createdAt: string;
};

type MessageBoardSectionProps = {
  initialMessages?: MessageItem[];
};

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function timeAgo(dateStr: string, d: any, lang: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return d.message.justNow;
  if (minutes < 60) return d.message.minutesAgo.replace("{n}", minutes.toString());
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return d.message.hoursAgo.replace("{n}", hours.toString());
  const days = Math.floor(hours / 24);
  if (days < 30) return d.message.daysAgo.replace("{n}", days.toString());
  return date.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US");
}

function buildTree(items: MessageItem[]) {
  const itemIds = new Set(items.map((i) => i.id));
  const topLevel: MessageItem[] = [];
  const repliesMap = new Map<string, MessageItem[]>();

  for (const item of items) {
    // 如果没有父级，或者父级不在当前列表（由于 limit 限制或删除），则视为当前视图的顶层
    if (!item.parentId || !itemIds.has(item.parentId)) {
      topLevel.push(item);
    } else {
      const existing = repliesMap.get(item.parentId) ?? [];
      existing.push(item);
      repliesMap.set(item.parentId, existing);
    }
  }
  return { topLevel, repliesMap };
}

function MessageCard({
  item,
  onReply,
  repliesMap,
  depth = 0,
  d,
  lang
}: {
  item: MessageItem;
  onReply: (parentId: string, parentName: string) => void;
  repliesMap: Map<string, MessageItem[]>;
  depth?: number;
  d: any;
  lang: string;
}) {
  const replies = repliesMap.get(item.id) ?? [];

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-sky-100 dark:border-sky-900/50 pl-4" : ""}>
      <div className="rounded-xl border border-white/50 bg-white/80 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/40">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt={item.name}
              className="size-10 shrink-0 rounded-full border border-white/60 object-cover shadow-sm"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-sm font-semibold text-white shadow-sm">
              {getInitials(item.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* Header: name + email + time */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{item.name}</span>
              {item.email && (
                <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">{item.email}</span>
              )}
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{timeAgo(item.createdAt, d, lang)}</span>
            </div>

            {/* Content */}
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {item.content}
            </p>

            {/* Reply button */}
            <button
              className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-sky-500 dark:text-zinc-500 dark:hover:text-sky-400"
              onClick={() => onReply(item.id, item.name)}
              type="button"
            >
              <Reply className="size-3.5" />
              {d.message.reply}
            </button>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <MessageCard
              d={d}
              depth={depth + 1}
              item={reply}
              key={reply.id}
              lang={lang}
              onReply={onReply}
              repliesMap={repliesMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MessageBoardSection({ initialMessages = [] }: MessageBoardSectionProps) {
  const { lang, dictionary } = useLang();
  const d = dictionary!;
  const { resolvedTheme } = useTheme();
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [isPending, startTransition] = useTransition();

  // Reply state
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

  const loadMessages = async () => {
    const response = await fetch("/api/comments?mode=message&limit=60", {
      cache: "no-store"
    });
    const result = await response.json();
    if (response.ok && result.ok) {
      setMessages(result.data);
    }
  };

  const handleReply = (parentId: string, parentName: string) => {
    setReplyTo({ id: parentId, name: parentName });
    // Focus the content input
    document.getElementById("message-content")?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const submit = () => {
    const finalName = session?.user?.name ?? name;
    if (!finalName.trim() || !content.trim()) {
      toast.error(d.message.errorFill);
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "message",
          name: finalName,
          email: session?.user?.email ?? email,
          avatarUrl: (session?.user as any)?.image ?? "",
          content,
          parentId: replyTo?.id ?? null
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? d.message.errorFailed);
        return;
      }
      toast.success(replyTo ? d.message.successReply : d.message.successMessage);
      setContent("");
      setReplyTo(null);
      await loadMessages();
    });
  };

  const { topLevel, repliesMap } = buildTree(messages);

  return (
    <section className="space-y-5 rounded-2xl border border-white/50 bg-white/70 p-5 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/40" id="message">
      <div className="flex items-center gap-2">
        <MessageCircle className="size-5 text-sky-500 dark:text-sky-400" />
        <h2 className="text-xl font-semibold">{d.message.title}</h2>
        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
          {messages.length} {d.message.countSuffix}
        </span>
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-300">
          <Reply className="size-4" />
          {d.message.reply} <span className="font-semibold">{replyTo.name}</span>
          <button
            type="button"
            className="ml-auto text-xs text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-200"
            onClick={cancelReply}
          >
            {d.message.cancel}
          </button>
        </div>
      )}

      {/* Input form */}
      <div className="relative z-50 space-y-3 rounded-xl border border-white/40 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/40">
        {!session?.user && (
          <div className="grid gap-2 md:grid-cols-2">
            <Input placeholder={d.message.nickname} value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder={d.message.emailOptional} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        )}
        {session?.user && (
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            {(session.user as any)?.image && (
              <img
                src={(session.user as any).image}
                alt=""
                className="size-6 rounded-full"
              />
            )}
            <span>{d.message.asIdentity.replace("{name}", session.user.name ?? "")}</span>
          </div>
        )}
        <div className="relative">
          <textarea
            id="message-content"
            className="min-h-24 w-full rounded-lg border border-white/60 bg-white/90 p-3 pr-10 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-sky-500 dark:focus:ring-sky-900/40"
            placeholder={replyTo ? d.message.replyTo.replace("{name}", replyTo.name) : d.message.writeMessage}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            type="button"
            className="absolute bottom-3 right-3 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
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
        <Button type="button" loading={isPending} onClick={submit}>
          {replyTo ? d.message.submitReply : d.message.submitMessage}
        </Button>
      </div>

      {/* Message list */}
      <div className="space-y-3" id="message-list">
        {topLevel.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">{d.message.empty}</p>
        ) : null}
        {topLevel.map((item) => (
          <MessageCard
            key={item.id}
            item={item}
            onReply={handleReply}
            repliesMap={repliesMap}
            d={d}
            lang={lang}
          />
        ))}
      </div>
    </section>
  );
}
