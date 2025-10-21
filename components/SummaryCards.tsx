"use client";

import { formatIRT } from "@/lib/format";
import { formatJalali } from "@/lib/dayjs";
import type { RatesPayload } from "@/lib/rates-cache";

interface SummaryCardsProps {
  holdingsIRT: number;
  expensesIRT: number;
  rates?: RatesPayload | null;
}

const Card = ({ title, value, subtitle, accent }: { title: string; value: string; subtitle?: string; accent?: string }) => (
  <div className="card flex flex-col gap-3 p-6">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</span>
    <div className="text-2xl font-bold text-slate-900 md:text-3xl">{value}</div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    {accent && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{accent}</span>}
  </div>
);

export const SummaryCards = ({ holdingsIRT, expensesIRT, rates }: SummaryCardsProps) => {
  const balance = holdingsIRT - expensesIRT;
  const netColor = balance >= 0 ? "text-emerald-600" : "text-rose-600";
  const netLabel = balance >= 0 ? "مازاد" : "کسری";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card
        title="ارزش کل دارایی‌ها (تومان)"
        value={`${formatIRT(holdingsIRT)} تومان`}
        subtitle="بر اساس آخرین نرخ‌های دریافت شده"
      />
      <Card
        title="هزینه‌های ثبت‌شده"
        value={`${formatIRT(expensesIRT)} تومان`}
        subtitle="جمع کل مخارج محاسبه‌شده به تومان"
      />
      <div className="card flex flex-col gap-3 p-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{netLabel}</span>
        <div className={`text-2xl font-bold md:text-3xl ${netColor}`}>{formatIRT(Math.abs(balance))} تومان</div>
        <p className="text-sm text-slate-500">ارزش خالص با در نظر گرفتن هزینه‌ها</p>
      </div>
      <div className="card flex flex-col gap-3 p-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">آخرین بروزرسانی</span>
        <div className="text-2xl font-bold text-slate-900 md:text-3xl">
          {rates?.lastUpdated ? formatJalali(rates.lastUpdated, "HH:mm - YYYY/MM/DD") : "نامشخص"}
        </div>
        <p className="text-sm text-slate-500">
          {rates?.stale
            ? "داده‌ها موقتا قدیمی هستند."
            : "داده‌های تازه از سرویس ناوسان"}
        </p>
      </div>
    </div>
  );
};
