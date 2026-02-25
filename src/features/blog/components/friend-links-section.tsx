"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FriendLinkItem = {
  id: string;
  avatarUrl: string;
  name: string;
  email: string;
  siteName: string;
  siteUrl: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

type FriendLinksSectionProps = {
  initialLinks?: FriendLinkItem[];
};

export function FriendLinksSection({ initialLinks = [] }: FriendLinksSectionProps) {
  const [links] = useState<FriendLinkItem[]>(initialLinks);
  const [submitting, startTransition] = useTransition();
  const [form, setForm] = useState({
    avatarUrl: "",
    name: "",
    email: "",
    siteName: "",
    siteUrl: "",
    description: ""
  });

  const submit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.siteName.trim() || !form.siteUrl.trim()) {
      toast.error("请完整填写友链申请信息");
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "friend-link-apply",
          ...form
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "友链申请失败");
        return;
      }
      toast.success("友链申请已提交，等待管理员审核");
      setForm({
        avatarUrl: "",
        name: "",
        email: "",
        siteName: "",
        siteUrl: "",
        description: ""
      });
    });
  };

  return (
    <>
      <section className="rounded-2xl border border-white/45 bg-white/65 p-6 backdrop-blur-md" id="friends">
        <h2 className="text-h2 font-semibold">朋友的网站链接</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.length === 0 ? <p className="text-sm text-muted">暂无已通过友链。</p> : null}
          {links.map((item) => (
            <article key={item.id} className="rounded-xl border border-border bg-white/80 p-4">
              <div className="mb-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="h-10 w-10 rounded-full object-cover" src={item.avatarUrl} alt={item.name} />
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted">{item.email}</p>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-muted">{item.description}</p>
              <Link href={item.siteUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary hover:underline">
                访问 {item.siteName}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/45 bg-white/65 p-6 backdrop-blur-md" id="friend-apply">
        <h2 className="text-h2 font-semibold">友链申请</h2>
        <p className="mt-2 text-muted">提交后将发送到管理员邮箱审核，通过后展示在友链列表。</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input
            placeholder="头像链接（https://）"
            value={form.avatarUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, avatarUrl: event.target.value }))}
          />
          <Input
            placeholder="昵称"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            placeholder="邮箱"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <Input
            placeholder="网站名称"
            value={form.siteName}
            onChange={(event) => setForm((prev) => ({ ...prev, siteName: event.target.value }))}
          />
          <Input
            placeholder="网站链接（https://）"
            value={form.siteUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, siteUrl: event.target.value }))}
          />
          <Input
            placeholder="网站简介"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </div>

        <Button className="mt-4" loading={submitting} type="button" onClick={submit}>
          提交友链申请
        </Button>
      </section>
    </>
  );
}
