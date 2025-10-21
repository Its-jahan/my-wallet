"use client";

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toIRT, type CurrencyCode, type RatesSnapshot } from "@/lib/conversion";
import { formatIRT, parseNumeric } from "@/lib/format";

interface ExpensesFormProps {
  rates?: RatesSnapshot | null;
  onSubmit: (payload: { description: string; amount: number; currency: CurrencyCode; spentAt: string }) => void;
  onImport: (payload: string) => void;
  onExport: () => string;
}

const currencyOptions: { value: CurrencyCode; label: string }[] = [
  { value: "USD", label: "دلار" },
  { value: "EUR", label: "یورو" },
  { value: "USDT", label: "تتر" },
  { value: "IRT", label: "تومان" }
];

const rateKey: Record<Exclude<CurrencyCode, "irt">, keyof RatesSnapshot> = {
  USD: "usdIRT",
  EUR: "eurIRT",
  USDT: "usdtIRT",
  IRT: "usdIRT"
};

export const ExpensesForm = ({ rates, onSubmit, onImport, onExport }: ExpensesFormProps) => {
  const [description, setDescription] = useState("هزینه روزانه");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState<CurrencyCode>("IRT");
  const [spentAt, setSpentAt] = useState(() => new Date().toISOString().slice(0, 10));
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
    onSubmit({ description: description.trim() || "هزینه بدون عنوان", amount: numericAmount, currency, spentAt });
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
    link.download = `expenses-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">ثبت هزینه جدید</h2>
        <p className="text-sm text-slate-500">هزینه را وارد کنید و معادل تومانی آن را به‌صورت لحظه‌ای مشاهده کنید.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label htmlFor="expense-description">شرح هزینه</label>
          <input
            id="expense-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="مثال: خرید تجهیزات"
          />
        </div>
        <div>
          <label htmlFor="expense-date">تاریخ هزینه</label>
          <input id="expense-date" type="date" value={spentAt} onChange={(event) => setSpentAt(event.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="expense-amount">مقدار</label>
          <input id="expense-amount" value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} />
        </div>
        <div>
          <label htmlFor="expense-currency">ارز</label>
          <select id="expense-currency" value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}>
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span>معادل تومانی:</span>
        <div className="text-lg font-bold text-slate-900">{formatIRT(irtValue)} تومان</div>
        {currency !== "IRT" && rates && (
          <span className="text-xs text-slate-500">
            هر {currencyOptions.find((c) => c.value === currency)?.label} ≈ {formatIRT(rates[rateKey[currency as Exclude<CurrencyCode, "irt">]])} تومان
          </span>
        )}
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">
          ثبت هزینه
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
