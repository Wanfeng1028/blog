"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FriendLinkApplySection() {
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
        <section className="rounded-2xl border border-white/45 bg-white/65 p-6 backdrop-blur-md" id="friend-apply">
            <h2 className="text-h2 font-semibold">友链申请</h2>
            <p className="mt-2 text-muted">提交后将发送到管理员邮箱审核，通过后展示在友链列表。</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Input
                    placeholder="头像链接（https://）"
                    value={form.avatarUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                />
                <Input
                    placeholder="昵称"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                    placeholder="邮箱"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Input
                    placeholder="网站名称"
                    value={form.siteName}
                    onChange={(e) => setForm((prev) => ({ ...prev, siteName: e.target.value }))}
                />
                <Input
                    placeholder="网站链接（https://）"
                    value={form.siteUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, siteUrl: e.target.value }))}
                />
                <Input
                    placeholder="网站简介"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
            </div>

            <Button className="mt-4" loading={submitting} type="button" onClick={submit}>
                提交友链申请
            </Button>
        </section>
    );
}
