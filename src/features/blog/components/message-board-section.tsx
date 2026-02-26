"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Reply } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

function buildTree(items: MessageItem[]) {
  const topLevel: MessageItem[] = [];
  const repliesMap = new Map<string, MessageItem[]>();

  for (const item of items) {
    if (!item.parentId) {
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
  replies,
  depth = 0
}: {
  item: MessageItem;
  onReply: (parentId: string, parentName: string) => void;
  replies: MessageItem[];
  depth?: number;
}) {
  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-sky-100 pl-4" : ""}>
      <div className="rounded-xl border border-white/50 bg-white/80 p-4 backdrop-blur-sm">
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
              <span className="text-sm font-semibold text-zinc-800">{item.name}</span>
              {item.email && (
                <span className="truncate text-xs text-zinc-400">{item.email}</span>
              )}
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-400">{timeAgo(item.createdAt)}</span>
            </div>

            {/* Content */}
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {item.content}
            </p>

            {/* Reply button */}
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-sky-500"
              onClick={() => onReply(item.id, item.name)}
            >
              <Reply className="size-3.5" />
              回复
            </button>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <MessageCard
              key={reply.id}
              item={reply}
              onReply={onReply}
              replies={[]}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MessageBoardSection({ initialMessages = [] }: MessageBoardSectionProps) {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [isPending, startTransition] = useTransition();

  // Reply state
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

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
      toast.error("请填写昵称和留言内容");
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
        toast.error(result.message ?? "留言失败");
        return;
      }
      toast.success(replyTo ? "回复成功" : "留言成功");
      setContent("");
      setReplyTo(null);
      await loadMessages();
    });
  };

  const { topLevel, repliesMap } = buildTree(messages);

  return (
    <section className="space-y-5 rounded-2xl border border-white/50 bg-white/70 p-5 backdrop-blur-md" id="message">
      <div className="flex items-center gap-2">
        <MessageCircle className="size-5 text-sky-500" />
        <h2 className="text-xl font-semibold">留言板</h2>
        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-600">
          {messages.length} 条留言
        </span>
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
          <Reply className="size-4" />
          回复 <span className="font-semibold">{replyTo.name}</span>
          <button
            type="button"
            className="ml-auto text-xs text-sky-500 hover:text-sky-700"
            onClick={cancelReply}
          >
            取消
          </button>
        </div>
      )}

      {/* Input form */}
      <div className="space-y-3 rounded-xl border border-white/40 bg-white/60 p-4 backdrop-blur-sm">
        {!session?.user && (
          <div className="grid gap-2 md:grid-cols-2">
            <Input placeholder="你的昵称" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="邮箱（可选）" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        )}
        {session?.user && (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            {(session.user as any)?.image && (
              <img
                src={(session.user as any).image}
                alt=""
                className="size-6 rounded-full"
              />
            )}
            <span>以 <strong>{session.user.name}</strong> 身份留言</span>
          </div>
        )}
        <textarea
          id="message-content"
          className="min-h-24 w-full rounded-lg border border-white/60 bg-white/90 p-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          placeholder={replyTo ? `回复 ${replyTo.name}...` : "写下你的留言..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button type="button" loading={isPending} onClick={submit}>
          {replyTo ? "发表回复" : "发表留言"}
        </Button>
      </div>

      {/* Message list */}
      <div className="space-y-3" id="message-list">
        {topLevel.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">还没有留言，来做第一个留言的人吧 ✨</p>
        ) : null}
        {topLevel.map((item) => (
          <MessageCard
            key={item.id}
            item={item}
            onReply={handleReply}
            replies={repliesMap.get(item.id) ?? []}
          />
        ))}
      </div>
    </section>
  );
}
