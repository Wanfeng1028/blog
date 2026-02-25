"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CaptchaPayload = {
  captchaId: string;
  svg: string;
};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaPayload | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadCaptcha = async () => {
    const response = await fetch("/api/auth/captcha", { cache: "no-store" });
    const result = await response.json();
    if (response.ok && result.ok) setCaptcha(result.data);
  };

  useEffect(() => {
    void loadCaptcha();
  }, []);

  const submit = () => {
    if (!captcha?.captchaId) return;
    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          captchaId: captcha.captchaId,
          captchaAnswer: captchaAnswer.trim()
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "发送失败");
        await loadCaptcha();
        return;
      }
      setMessage("重置验证码已发送，请前往邮箱查收。");
      if (result.data?.debugCode) {
        toast.message(`开发环境验证码: ${result.data.debugCode}`);
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-6 shadow-soft">
      <h1 className="text-2xl font-semibold">忘记密码</h1>
      <Input onChange={(event) => setEmail(event.target.value)} placeholder="邮箱" type="email" value={email} />
      <div className="flex items-center gap-2">
        {captcha ? (
          <button className="rounded-md border border-border bg-white p-1" onClick={() => void loadCaptcha()} type="button">
            <img alt="captcha" className="h-12 w-40" src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha.svg)}`} />
          </button>
        ) : null}
        <Input onChange={(event) => setCaptchaAnswer(event.target.value)} placeholder="验证码" value={captchaAnswer} />
      </div>
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      <Button className="w-full" loading={isPending} onClick={submit} type="button">
        发送重置验证码
      </Button>
      <p className="text-center text-sm text-muted">
        已有验证码？
        <Link className="ml-1 text-primary hover:underline" href="/reset-password">
          去重置密码
        </Link>
      </p>
    </div>
  );
}
