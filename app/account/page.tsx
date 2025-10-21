"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

type Status = "idle" | "loading" | "success" | "error";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseSession();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || status === "loading") return;
    const client = getSupabaseClient();
    if (!client) {
      setStatus("error");
      setMessage("اتصال به Supabase برقرار نشد.");
      return;
    }
    setStatus("loading");
    setMessage("");
    const { error } = await client.auth.updateUser({ email });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("success");
    setMessage("اطلاعات حساب به‌روزرسانی شد. در صورت نیاز ایمیل تایید برای شما ارسال می‌شود.");
  };

  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
    router.replace("/login");
  };

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-dashed border-slate-200 bg-white/90 p-12 text-center text-sm text-slate-500">
        {loading ? "در حال بررسی حساب کاربری..." : "برای مدیریت حساب ابتدا وارد شوید."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-3 p-6">
        <h2 className="text-lg font-semibold text-slate-900">تنظیمات حساب کاربری</h2>
        <p className="text-sm text-slate-500">
          ایمیل ورود خود را تغییر دهید یا از حساب کاربری خارج شوید. تغییر ایمیل ممکن است نیاز به تایید ایمیل جدید داشته باشد.
        </p>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label htmlFor="account-email">ایمیل</label>
            <input
              id="account-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          {message && (
            <p className={`text-sm ${status === "error" ? "text-rose-500" : "text-emerald-600"}`}>
              {message}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary" disabled={status === "loading"}>
              {status === "loading" ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              خروج از حساب
            </button>
          </div>
        </form>
      </div>
      <div className="card p-6 text-sm text-slate-500">
        <p>برای تغییر رمز عبور می‌توانید از قابلیت "فراموشی رمز عبور" در Supabase Auth استفاده کنید.</p>
      </div>
    </div>
  );
}
