"use client";

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { formatIRT, parseNumeric } from "@/lib/format";
import { toIRT, type CurrencyCode, type RatesSnapshot } from "@/lib/conversion";

interface HoldingsFormProps {
  rates?: RatesSnapshot | null;
  onSubmit: (payload: { title: string; amount: number; currency: CurrencyCode }) => void;
  onImport: (payload: string) => void;
  onExport: () => string;
}

const currencyOptions: { value: CurrencyCode; label: string }[] = [
  { value: "usd", label: "دلار آمریکا" },
  { value: "eur", label: "یورو" },
  { value: "usdt", label: "تتر" },
  { value: "irt", label: "تومان" }
];

const rateKey: Record<Exclude<CurrencyCode, "irt">, keyof RatesSnapshot> = {
  usd: "usdIRT",
  eur: "eurIRT",
  usdt: "usdtIRT"
};

export const HoldingsForm = ({ rates, onSubmit, onImport, onExport }: HoldingsFormProps) => {
  const [title, setTitle] = useState("حساب اصلی");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState<CurrencyCode>("usd");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const numericAmount = useMemo(() => parseNumeric(amount), [amount]);
  const irtValue = useMemo(() => toIRT(numericAmount, currency, rates ?? undefined), [numericAmount, currency, rates]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (numericAmount < 0) {
      setError("مقدار نمی‌تواند منفی باشد.");
      return;
    }
    setError(null);
    onSubmit({ title: title.trim() || "بدون عنوان", amount: numericAmount, currency });
    setAmount("0");
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onImport(text);
    event.target.value = "";
  };

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([data], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `holdings-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">افزودن دارایی جدید</h2>
        <p className="text-sm text-slate-500">مقادیر را به ارز مورد نظر وارد کنید تا معادل تومانی محاسبه شود.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label htmlFor="holding-title">عنوان دارایی</label>
          <input
            id="holding-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثال: سرمایه ارزی صرافی"
          />
        </div>
        <div>
          <label htmlFor="holding-currency">ارز</label>
          <select id="holding-currency" value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}>
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="holding-amount">مقدار</label>
          <input
            id="holding-amount"
            value={amount}
            inputMode="decimal"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="مثال: 1200"
          />
        </div>
        <div className="flex flex-col justify-end rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>ارزش معادل:</span>
          <span className="text-lg font-bold text-slate-900">{formatIRT(irtValue)} ریال</span>
          {currency !== "irt" && rates && (
            <span className="text-xs text-slate-500">
              هر {currencyOptions.find((c) => c.value === currency)?.label} ≈ {formatIRT(rates[rateKey[currency as Exclude<CurrencyCode, "irt">]])} ریال
            </span>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">
          ثبت دارایی
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          خروجی JSON
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          وارد کردن از فایل
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
      </div>
    </form>
  );
};
