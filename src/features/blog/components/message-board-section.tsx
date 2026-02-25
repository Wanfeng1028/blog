"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MessageItem = {
  id: string;
  name: string;
  email: string | null;
  content: string;
  status: "VISIBLE" | "HIDDEN" | "DELETED" | "PENDING";
  createdAt: string;
};

type MessageBoardSectionProps = {
  initialMessages?: MessageItem[];
};

export function MessageBoardSection({ initialMessages = [] }: MessageBoardSectionProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [isPending, startTransition] = useTransition();

  const loadMessages = async () => {
    const response = await fetch("/api/comments?mode=message&limit=40", {
      cache: "no-store"
    });
    const result = await response.json();
    if (response.ok && result.ok) {
      setMessages(result.data);
    }
  };

  const submit = () => {
    if (!name.trim() || !content.trim()) {
      toast.error("请填写昵称和留言内容");
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "message",
          name,
          email,
          content
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "留言失败");
        return;
      }
      toast.success("留言成功");
      setContent("");
      await loadMessages();
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/50 bg-white/70 p-5 backdrop-blur-md" id="message">
      <h2 className="text-xl font-semibold">留言板</h2>

      <div className="grid gap-2 md:grid-cols-2">
        <Input placeholder="你的昵称" value={name} onChange={(event) => setName(event.target.value)} />
        <Input
          placeholder="邮箱（可选）"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <textarea
        className="min-h-28 w-full rounded-md border border-border bg-white/90 p-3 text-sm outline-none focus:border-primary"
        placeholder="写下你的留言..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <Button type="button" loading={isPending} onClick={submit}>
        发表留言
      </Button>

      <div className="space-y-3" id="message-list">
        {messages.length === 0 ? <p className="text-sm text-muted">还没有留言，来做第一个留言的人吧。</p> : null}
        {messages.map((item) => (
          <div key={item.id} className="rounded-xl border border-border bg-white/80 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <p className="mt-2 text-sm text-muted">{item.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
