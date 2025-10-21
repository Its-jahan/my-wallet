"use client";

import { useEffect, useMemo, useState } from "react";
import { HoldingsForm } from "./HoldingsForm";
import { ExpensesForm } from "./ExpensesForm";
import { ExpensesTable } from "./ExpensesTable";
import { SummaryCards } from "./SummaryCards";
import { UpdateBanner } from "./UpdateBanner";
import { useRates } from "@/hooks/useRates";
import { useHoldings } from "@/hooks/useHoldings";
import { useExpenses } from "@/hooks/useExpenses";
import type { RatesSnapshot } from "@/lib/conversion";
import { formatIRT } from "@/lib/format";
import { formatJalali } from "@/lib/dayjs";

export const Dashboard = () => {
  const { rates, isLoading, error, mutate, showStale, clearStale } = useRates();

  const ratesSnapshot: RatesSnapshot | null = useMemo(() => {
    if (!rates) return null;
    return {
      usdIRT: rates.usdIRT,
      eurIRT: rates.eurIRT,
      usdtIRT: rates.usdtIRT
    };
  }, [rates]);

  const holdings = useHoldings({ rates: ratesSnapshot });
  const expenses = useExpenses({ rates: ratesSnapshot });

  const holdingsTotal = holdings.totals.irt;
  const expensesTotal = expenses.totals.irt;
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleManualSync = async () => {
    if (syncStatus === "loading") return;
    setSyncStatus("loading");
    try {
      const [holdingsSynced, expensesSynced] = await Promise.all([
        holdings.syncToSupabase(),
        expenses.syncToSupabase()
      ]);
      if (holdingsSynced && expensesSynced) {
        setSyncStatus("success");
      } else {
        setSyncStatus("error");
      }
    } catch (err) {
      console.error("Manual sync failed", err);
      setSyncStatus("error");
    }
  };

  useEffect(() => {
    if (syncStatus === "success" || syncStatus === "error") {
      const timer = setTimeout(() => setSyncStatus("idle"), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [syncStatus]);

  return (
    <div className="space-y-8">
      <UpdateBanner
        visible={showStale}
        lastUpdated={rates?.lastUpdated}
        onRefresh={() => mutate()}
        onClose={clearStale}
      />

      <SummaryCards holdingsIRT={holdingsTotal} expensesIRT={expensesTotal} rates={rates ?? null} />

      <div className="card flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">همگام‌سازی با Supabase</h3>
          <p className="text-xs text-slate-500">داده‌های فعلی دارایی‌ها و هزینه‌ها را در پایگاه داده ذخیره کنید.</p>
          {syncStatus === "success" && <p className="text-xs text-emerald-600">ذخیره‌سازی با موفقیت انجام شد.</p>}
          {syncStatus === "error" && <p className="text-xs text-rose-600">ذخیره‌سازی با خطا مواجه شد. لطفا دوباره تلاش کنید.</p>}
        </div>
        <button
          type="button"
          onClick={handleManualSync}
          disabled={syncStatus === "loading"}
          className="btn-primary disabled:opacity-60"
        >
          {syncStatus === "loading" ? "در حال ذخیره..." : "ذخیره همه داده‌ها"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HoldingsForm
          rates={ratesSnapshot}
          onSubmit={holdings.addHolding}
          onImport={holdings.importHoldings}
          onExport={holdings.exportHoldings}
        />
        <ExpensesForm
          rates={ratesSnapshot}
          onSubmit={expenses.addExpense}
          onImport={expenses.importExpenses}
          onExport={expenses.exportExpenses}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ExpensesTable
          expenses={expenses.expenses}
          onRemove={expenses.removeExpense}
          onUndo={expenses.undoRemove}
          lastRemoved={expenses.lastRemoved}
        />
        <div className="card flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">دارایی‌های ثبت‌شده</h3>
              <p className="text-sm text-slate-500">مقادیر ذخیره‌شده به همراه معادل تومانی</p>
            </div>
            {holdings.lastRemoved && (
              <button
                type="button"
                onClick={holdings.undoRemove}
                className="rounded-xl border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
              >
                بازگردانی
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {holdings.holdings.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">دارایی ثبت نشده است.</p>
            ) : (
              <ul className="space-y-3">
                {holdings.holdings.map((holding) => (
                  <li key={holding.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-800">{holding.title}</p>
                        <p className="text-xs text-slate-500">ثبت شده در {formatJalali(holding.createdAt, "YYYY/MM/DD")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => holdings.removeHolding(holding.id)}
                        className="rounded-xl border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        حذف
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                        {holding.amount.toLocaleString("fa-IR", {
                          minimumFractionDigits: holding.currency === "irt" ? 1 : 0,
                          maximumFractionDigits: holding.currency === "irt" ? 1 : 2
                        })}{" "}
                        {holding.currency.toUpperCase()}
                      </span>
                      <span className="font-semibold text-slate-800">{formatIRT(holding.irtValue)} تومان</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-8 text-center text-sm text-slate-500">
          در حال دریافت نرخ‌های جدید از ناوسان...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-600">
          دریافت نرخ‌ها با خطا مواجه شد. لطفا اتصال خود را بررسی کنید یا بعدا تلاش نمایید.
        </div>
      )}
    </div>
  );
};
