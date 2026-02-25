"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          password,
          confirmPassword
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "重置失败");
        return;
      }
      toast.success("重置成功，请重新登录");
      router.push("/login");
    });
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-6 shadow-soft">
      <h1 className="text-2xl font-semibold">重置密码</h1>
      <Input onChange={(event) => setEmail(event.target.value)} placeholder="邮箱" type="email" value={email} />
      <Input onChange={(event) => setCode(event.target.value)} placeholder="邮箱验证码" value={code} />
      <Input onChange={(event) => setPassword(event.target.value)} placeholder="新密码（至少 8 位）" type="password" value={password} />
      <Input
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="确认新密码"
        type="password"
        value={confirmPassword}
      />
      <Button className="w-full" loading={isPending} onClick={submit} type="button">
        提交重置
      </Button>
      <p className="text-center text-sm text-muted">
        没收到验证码？
        <Link className="ml-1 text-primary hover:underline" href="/forgot-password">
          重新发送
        </Link>
      </p>
    </div>
  );
}
