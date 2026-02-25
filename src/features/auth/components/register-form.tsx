"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CaptchaPayload = {
  captchaId: string;
  svg: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaPayload | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [needVerify, setNeedVerify] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadCaptcha = async () => {
    const response = await fetch("/api/auth/captcha", { cache: "no-store" });
    const result = await response.json();
    if (response.ok && result.ok) setCaptcha(result.data);
  };

  useEffect(() => {
    void loadCaptcha();
  }, []);

  const submitRegister = () => {
    setErrorMessage("");
    if (!captcha?.captchaId) return;

    if (!email.trim() || !password || !confirmPassword || !captchaAnswer.trim()) {
      setErrorMessage("请填写完整信息。");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("密码至少 8 位。");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("两次密码不一致。");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          captchaId: captcha.captchaId,
          captchaAnswer: captchaAnswer.trim()
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        const message = result.message ?? "注册失败";
        setErrorMessage(message);
        toast.error(message);
        await loadCaptcha();
        return;
      }

      setNeedVerify(true);
      setErrorMessage("");
      toast.success("注册成功，请输入邮件验证码激活账号");
      if (result.data?.debugCode) {
        toast.message(`开发环境验证码：${result.data.debugCode}`);
      }
    });
  };

  const submitVerify = () => {
    startTransition(async () => {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: verifyCode.trim()
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "激活失败");
        return;
      }

      const login = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        captchaId: captcha?.captchaId ?? "",
        captchaAnswer: captchaAnswer.trim(),
        deviceId: localStorage.getItem("device_id") ?? crypto.randomUUID(),
        userAgent: navigator.userAgent,
        redirect: false
      });

      if (!login || login.error) {
        toast.success("邮箱已激活，请登录");
        router.push("/login");
        return;
      }
      toast.success("注册并登录成功");
      router.push("/blog");
    });
  };

  return (
    <div className="auth-card w-full max-w-md space-y-4 rounded-2xl p-6 text-white">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">注册晚风博客</h1>
        <p className="text-sm text-slate-200/85">创建账号后即可评论、留言与管理个人信息。</p>
      </div>

      {!needVerify ? (
        <>
          <Input
            className="border-sky-200/30 bg-white/90 text-zinc-900"
            onChange={(event) => setName(event.target.value)}
            placeholder="昵称（可选）"
            value={name}
          />
          <Input
            className="border-sky-200/30 bg-white/90 text-zinc-900"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="邮箱"
            type="email"
            value={email}
          />
          <Input
            className="border-sky-200/30 bg-white/90 text-zinc-900"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="密码（至少 8 位）"
            type="password"
            value={password}
          />
          <Input
            className="border-sky-200/30 bg-white/90 text-zinc-900"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="确认密码"
            type="password"
            value={confirmPassword}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {captcha ? (
                <button className="rounded-md border border-white/30 bg-white/95 p-1" onClick={() => void loadCaptcha()} type="button">
                  <img alt="captcha" className="h-12 w-40" src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha.svg)}`} />
                </button>
              ) : null}
              <Input
                className="border-sky-200/30 bg-white/90 text-zinc-900"
                onChange={(event) => setCaptchaAnswer(event.target.value)}
                placeholder="验证码"
                value={captchaAnswer}
              />
            </div>
            <p className="text-xs text-slate-200/80">看不清可点击图片刷新</p>
          </div>

          {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
          <Button className="w-full" loading={isPending} onClick={submitRegister} type="button">
            注册并发送验证码
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-100/90">
            验证码已发送至 <span className="font-medium">{email}</span>，请输入邮件中的验证码。
          </p>
          <Input
            className="border-sky-200/30 bg-white/90 text-zinc-900"
            onChange={(event) => setVerifyCode(event.target.value)}
            placeholder="邮箱验证码"
            value={verifyCode}
          />
          <Button className="w-full" loading={isPending} onClick={submitVerify} type="button">
            激活并登录
          </Button>
        </>
      )}

      <p className="text-center text-sm text-slate-100/90">
        已有账号？
        <Link className="ml-1 hover:underline" href="/login">
          去登录
        </Link>
      </p>
    </div>
  );
}
