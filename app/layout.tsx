import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";
import { NavUserControls } from "@/components/NavUserControls";
import { PwaInitializer } from "@/components/PwaInitializer";

export const metadata: Metadata = {
  title: "کیف پول من",
  description: "مدیریت دارایی‌ها و هزینه‌ها با نرخ‌های زنده بازار",
  themeColor: "#0f172a",
  applicationName: "کیف پول من",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png"
  },
  appleWebApp: {
    capable: true,
    title: "کیف پول من",
    statusBarStyle: "default"
  }
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-32 h-72 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_65%)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_right,_rgba(14,116,144,0.18),_transparent_70%)] md:block" />
          <header className="relative z-10 border-b border-white/40 bg-white/70 backdrop-blur-lg">
            <div className="container flex flex-col gap-2 py-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">کیف پول دیجیتال</h1>
                <p className="text-sm text-slate-500 md:text-base">
                  پیگیری لحظه‌ای دارایی‌ها، هزینه‌ها و نرخ ارز با رابط کاربری فارسی و راست به چپ
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 md:text-sm">
                <span className="rounded-full bg-primary/10 px-4 py-2 font-medium text-primary">نرخ‌ها هر روز به‌روزرسانی می‌شوند</span>
                <NavUserControls />
                <span className="hidden rounded-full bg-emerald-50 px-4 py-2 font-medium text-emerald-600 md:inline-flex">
                  مناسب برای استفاده روی موبایل و دسکتاپ
                </span>
              </div>
            </div>
          </header>
          <main className="relative z-10 pb-24 pt-10">
            <div className="container max-w-6xl">
              {children}
            </div>
          </main>
          <footer className="relative z-10 border-t border-white/50 bg-white/70 py-6 text-center text-xs text-slate-500 backdrop-blur-lg">
            <p>ساخته شده برای پایش دارایی‌های ارزی با پشتیبانی از حالت آفلاین و همگام‌سازی ابری.</p>
          </footer>
        </div>
        <PwaInitializer />
      </body>
    </html>
  );
}
