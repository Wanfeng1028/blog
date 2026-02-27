"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDictionary } from "@/features/i18n/lang-context";

export function ResetPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dict = useDictionary();

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
        toast.error(result.message ?? dict.auth.resetFail);
        return;
      }
      toast.success(dict.auth.resetSuccess);
      router.push("/login");
    });
  };

  return (
    <div className="auth-card w-full max-w-md space-y-4 rounded-2xl p-6 text-white">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{dict.auth.resetTitle}</h1>
      </div>
      <Input className="border-sky-200/30 bg-white/90 text-zinc-900" onChange={(event) => setEmail(event.target.value)} placeholder={dict.auth.email} type="email" value={email} />
      <Input className="border-sky-200/30 bg-white/90 text-zinc-900" onChange={(event) => setCode(event.target.value)} placeholder={dict.auth.emailVerifyCode} value={code} />
      <div className="relative">
        <Input
          className="border-sky-200/30 bg-white/90 pr-10 text-zinc-900"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={dict.auth.newPassword}
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
          placeholder={dict.auth.confirmNewPassword}
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
      <Button className="w-full" loading={isPending} onClick={submit} type="button">
        {dict.auth.resetSubmit}
      </Button>
      <p className="text-center text-sm text-slate-100/90">
        {dict.auth.noCode}
        <Link className="ml-1 hover:underline" href="/forgot-password">
          {dict.auth.resend}
        </Link>
      </p>
    </div>
  );
}
