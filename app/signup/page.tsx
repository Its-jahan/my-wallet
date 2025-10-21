"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

type AuthStatus = "idle" | "loading" | "success" | "error";

const initialError = "";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState(initialError);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace("/");
    }
  }, [router, sessionLoading, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading") return;
    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند.");
      setFeedback("");
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setStatus("error");
      setError("پیکربندی Supabase یافت نشد. لطفا مقادیر ENV را بررسی کنید.");
      setFeedback("");
      return;
    }

    setStatus("loading");
    setError(initialError);
    setFeedback("");
    const { data, error: signupError } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined
      }
    });
    if (signupError) {
      setStatus("error");
      setError(signupError.message);
      return;
    }

    if (data.session) {
      setStatus("success");
      setFeedback("ثبت‌نام انجام شد و شما مستقیما وارد شدید.");
      router.replace("/");
      return;
    }

    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (!signInError) {
      setStatus("success");
      setFeedback("ثبت‌نام انجام شد و شما مستقیما وارد شدید.");
      router.replace("/");
      return;
    }

    setStatus("success");
    setFeedback("ثبت‌نام انجام شد. در صورت فعال بودن تایید ایمیل، لطفا لینک ارسال‌شده را تایید کنید.");
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
      <h2 className="text-center text-2xl font-bold text-slate-900">ایجاد حساب کاربری</h2>
      <p className="mt-2 text-center text-sm text-slate-500">برای دسترسی به پرتفوی ابتدا ثبت‌نام کنید.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="signup-email">ایمیل</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="signup-password">رمز عبور</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
          />
        </div>
        <div>
          <label htmlFor="signup-password-confirm">تکرار رمز عبور</label>
          <input
            id="signup-password-confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="********"
          />
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        {feedback && <p className="text-sm text-emerald-600">{feedback}</p>}
        <button type="submit" className="btn-primary w-full text-center" disabled={status === "loading" || sessionLoading}>
          {status === "loading" ? "در حال ساخت حساب..." : "ساخت حساب"}
        </button>
      </form>
      <div className="mt-6 text-center text-xs text-slate-500">
        <Link href="/login" className="text-primary hover:underline">
          قبلا ثبت‌نام کرده‌اید؟ وارد شوید
        </Link>
      </div>
    </div>
  );
}
