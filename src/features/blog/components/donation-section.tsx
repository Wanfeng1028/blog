"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DonationItem = {
  id: string;
  name: string;
  email: string | null;
  amount: number;
  message: string | null;
  paymentMethod: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  createdAt: string;
};

type DonationSectionProps = {
  initialItems?: DonationItem[];
};

export function DonationSection({ initialItems = [] }: DonationSectionProps) {
  const [items] = useState<DonationItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    amount: "",
    message: "",
    paymentMethod: "WECHAT" as "WECHAT" | "ALIPAY" | "OTHER"
  });

  const submit = () => {
    const amountNumber = Number(form.amount);
    if (!form.name.trim() || !amountNumber || amountNumber <= 0) {
      toast.error("请填写昵称和有效金额");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "donation",
          name: form.name,
          email: form.email,
          amount: amountNumber,
          message: form.message,
          paymentMethod: form.paymentMethod
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "打赏记录提交失败");
        return;
      }
      toast.success("打赏记录已提交，管理员确认后公开展示");
      setForm((prev) => ({ ...prev, amount: "", message: "" }));
    });
  };

  return (
    <section className="rounded-2xl border border-white/45 bg-white/65 p-6 backdrop-blur-md" id="support">
      <h2 className="text-h2 font-semibold">打赏 / 支持我</h2>
      <p className="mt-2 text-muted">感谢你的支持，每一份鼓励都会让我持续更新内容。</p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-white p-2">
          <Image src="/images/WeixinPay.jpg" alt="微信收款码" width={480} height={640} className="h-auto w-full" />
        </div>

        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="昵称"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              placeholder="邮箱（可选）"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <Input
              placeholder="金额（元）"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            />
            <select
              className="h-10 rounded-md border border-border bg-white px-3 text-sm outline-none"
              value={form.paymentMethod}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  paymentMethod: event.target.value as "WECHAT" | "ALIPAY" | "OTHER"
                }))
              }
            >
              <option value="WECHAT">微信</option>
              <option value="ALIPAY">支付宝</option>
              <option value="OTHER">其他</option>
            </select>
          </div>
          <textarea
            className="min-h-24 w-full rounded-md border border-border bg-white p-3 text-sm outline-none focus:border-primary"
            placeholder="留言（可选）"
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          />
          <Button loading={isPending} type="button" onClick={submit}>
            提交打赏记录
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <h3 className="text-base font-semibold">已确认支持名单</h3>
        {items.length === 0 ? <p className="text-sm text-muted">暂无公开记录。</p> : null}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-white/85 p-3">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted">￥{item.amount.toFixed(2)}</p>
              {item.message ? <p className="mt-1 text-xs text-muted">{item.message}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
