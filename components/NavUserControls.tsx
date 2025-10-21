"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export const NavUserControls = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useSupabaseSession();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    const client = getSupabaseClient();
    if (!client) return;
    setSigningOut(true);
    await client.auth.signOut();
    setSigningOut(false);
    if (pathname !== "/login") {
      router.replace("/login");
    }
  };

  if (loading) {
    return (
      <span className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-400">
        در حال بررسی حساب...
      </span>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          ورود
        </Link>
        <Link href="/signup" className="btn-primary px-4 py-2 text-xs font-semibold text-white">
          ثبت‌نام
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <Link
        href="/account"
        className="rounded-xl border border-primary/20 px-4 py-2 font-medium text-primary transition hover:bg-primary/10"
      >
        {user.email ?? "کاربر"}
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="rounded-xl border border-rose-200 px-4 py-2 font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
      >
        {signingOut ? "در حال خروج..." : "خروج"}
      </button>
    </div>
  );
};
