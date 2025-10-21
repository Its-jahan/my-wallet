"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

type AuthStatus = "idle" | "loading" | "success" | "error";

const initialError = "";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace("/");
    }
  }, [router, sessionLoading, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading") return;

    const client = getSupabaseClient();
    if (!client) {
      setStatus("error");
      setError("پیکربندی Supabase یافت نشد. لطفا مقادیر ENV را بررسی کنید.");
      return;
    }

    setStatus("loading");
    setError(initialError);
    const { error: authError } = await client.auth.signInWithPassword({ email, password });
    if (authError) {
      setStatus("error");
      setError(authError.message);
      return;
    }
    setStatus("success");
    router.replace("/");
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
      <h2 className="text-center text-2xl font-bold text-slate-900">ورود به حساب کاربری</h2>
      <p className="mt-2 text-center text-sm text-slate-500">برای مشاهده پرتفوی خود اطلاعات ورود را وارد کنید.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email">ایمیل</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password">رمز عبور</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
          />
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        {status === "success" && <p className="text-sm text-emerald-600">ورود موفقیت‌آمیز بود. در حال انتقال...</p>}
        <button type="submit" className="btn-primary w-full text-center" disabled={status === "loading" || sessionLoading}>
          {status === "loading" ? "در حال ورود..." : "ورود"}
        </button>
      </form>
      <div className="mt-6 flex flex-col items-center gap-2 text-xs text-slate-500">
        <Link href="/signup" className="text-primary hover:underline">
          حساب کاربری ندارید؟ ثبت‌نام کنید
        </Link>
        <Link href="/" className="hover:underline">
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
