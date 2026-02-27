"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDictionary } from "@/features/i18n/lang-context";

type CaptchaPayload = {
  captchaId: string;
  svg: string;
};

function getOrCreateDeviceId() {
  const key = "device_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl");
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaPayload | null>(null);
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

  useEffect(() => {
    void router.prefetch("/dashboard");
    if (callbackUrl?.startsWith("/")) void router.prefetch(callbackUrl);
  }, [callbackUrl, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    const defaultTarget = session.user.role === "ADMIN" ? "/admin" : "/dashboard";
    const target = callbackUrl && callbackUrl !== "/login" ? callbackUrl : defaultTarget;
    window.location.href = target;
  }, [status, session, callbackUrl]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    if (!captcha?.captchaId) return;
    if (!email.trim() || !password || !captchaAnswer.trim()) {
      setErrorMessage(dict.auth.loginFormErrorEmpty);
      return;
    }

    setIsLoading(true);
    try {
      const target = callbackUrl && callbackUrl !== "/login" ? callbackUrl : "/dashboard";

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        captchaId: captcha.captchaId,
        captchaAnswer: captchaAnswer.trim(),
        deviceId: getOrCreateDeviceId(),
        userAgent: navigator.userAgent,
        redirect: false
      });

      if (!result || result.error) {
        setErrorMessage(dict.auth.loginFormErrorInvalid);
        toast.error(dict.auth.loginFormErrorInvalid);
        await loadCaptcha();
        setIsLoading(false);
        return;
      }

      toast.success(dict.auth.loginSuccess);
      // Force a hard navigation — this is the most reliable redirect method
      window.location.replace(target);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <form className="auth-card w-full max-w-md space-y-4 rounded-2xl p-6 text-white" onSubmit={onSubmit}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{dict.auth.loginTitle}</h1>
        <p className="text-sm text-slate-200/85">{dict.auth.loginSubtitle}</p>
      </div>

      <Input
        autoComplete="email"
        className="border-sky-200/30 bg-white/90 text-zinc-900"
        onChange={(event) => setEmail(event.target.value)}
        placeholder={dict.auth.email}
        required
        type="email"
        value={email}
      />
      <div className="relative">
        <Input
          autoComplete="current-password"
          className="border-sky-200/30 bg-white/90 pr-10 text-zinc-900"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={dict.auth.password}
          required
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
        <p className="text-xs text-slate-200/80">{dict.auth.captchaHint}</p>
      </div>

      {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
      <Button className="w-full" loading={isLoading} type="submit">
        {dict.auth.loginSubmit}
      </Button>

      <div className="flex items-center justify-between text-sm text-slate-100/90">
        <Link className="hover:underline" href="/register">
          {dict.auth.noAccount}
        </Link>
        <Link className="hover:underline" href="/forgot-password">
          {dict.auth.forgotPassword}
        </Link>
      </div>
    </form>
  );
}
