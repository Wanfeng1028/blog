"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDictionary } from "@/features/i18n/lang-context";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaPayload | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [needVerify, setNeedVerify] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dict = useDictionary();

  const loadCaptcha = async () => {
    const response = await fetch("/api/auth/captcha", { cache: "no-store" });
    const result = await response.json();
    if (response.ok && result.ok) setCaptcha(result.data);
  };

  useEffect(() => {
    void loadCaptcha();
  }, []);

  const submitRegister = async () => {
    setErrorMessage("");
    if (!captcha?.captchaId) return;

    if (!email.trim() || !password || !confirmPassword || !captchaAnswer.trim()) {
      setErrorMessage(dict.auth.registerFormErrorEmpty);
      return;
    }
    if (password.length < 8) {
      setErrorMessage(dict.auth.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(dict.auth.passwordMismatch);
      return;
    }

    setIsLoading(true);
    try {
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
        setIsLoading(false);
        return;
      }

      setNeedVerify(true);
      setErrorMessage("");
      toast.success("注册成功，请输入邮件验证码激活账号");
      if (result.data?.debugCode) {
        toast.message(`开发环境验证码：${result.data.debugCode}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitVerify = async () => {
    setIsLoading(true);
    try {
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
        setIsLoading(false);
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
        return; // Next.js loading kicks in
      }
      toast.success("注册并登录成功");
      router.push("/blog");
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card w-full max-w-md space-y-4 rounded-2xl p-6 text-white">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{dict.auth.registerTitle}</h1>
        <p className="text-sm text-slate-200/85">{dict.auth.registerSubtitle}</p>
      </div>

      {!needVerify ? (
        <>
          <Input
            className="border-sky-200/30 bg-white/90 text-zinc-900"
            onChange={(event) => setName(event.target.value)}
            placeholder={dict.auth.nickname}
            value={name}
          />
          <Input
            className="border-sky-200/30 bg-white/90 text-zinc-900"
            onChange={(event) => setEmail(event.target.value)}
            placeholder={dict.auth.email}
            type="email"
            value={email}
          />
          <div className="relative">
            <Input
              className="border-sky-200/30 bg-white/90 pr-10 text-zinc-900"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={dict.auth.passwordMin8}
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20" /><path d="M6.71 6.71q2.3-.71 5.29-.71 7 0 10 7a15.5 15.5 0 0 1-2.09 2.71" /><path d="M14.08 14.08a3 3 0 0 1-4.16-4.16" /><path d="M9.9 17.56a12 12 0 0 1-7.9-5.56 15.5 15.5 0 0 1 2.5-3.08" /></svg>
              )}
            </button>
          </div>
          <div className="relative">
            <Input
              className="border-sky-200/30 bg-white/90 pr-10 text-zinc-900"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={dict.auth.confirmPassword}
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20" /><path d="M6.71 6.71q2.3-.71 5.29-.71 7 0 10 7a15.5 15.5 0 0 1-2.09 2.71" /><path d="M14.08 14.08a3 3 0 0 1-4.16-4.16" /><path d="M9.9 17.56a12 12 0 0 1-7.9-5.56 15.5 15.5 0 0 1 2.5-3.08" /></svg>
              )}
            </button>
          </div>

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
                placeholder={dict.auth.captcha}
                value={captchaAnswer}
              />
            </div>
            <p className="text-xs text-slate-200/80">{dict.auth.captchaHint2}</p>
          </div>

          {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
          <Button className="w-full" loading={isLoading} onClick={submitRegister} type="button">
            {dict.auth.registerSubmit}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-100/90">
            {dict.auth.verifyCodeSent} <span className="font-medium">{email}</span>，请输入邮件中的验证码。
          </p>
          <Input
            className="border-sky-200/30 bg-white/90 text-zinc-900"
            onChange={(event) => setVerifyCode(event.target.value)}
            placeholder={dict.auth.emailVerifyCode}
            value={verifyCode}
          />
          <Button className="w-full" loading={isLoading} onClick={submitVerify} type="button">
            {dict.auth.verifySubmit}
          </Button>
        </>
      )}

      <p className="text-center text-sm text-slate-100/90">
        {dict.auth.hasAccount}
        <Link className="ml-1 hover:underline" href="/login">
          {dict.auth.toLogin}
        </Link>
      </p>
    </div>
  );
}
