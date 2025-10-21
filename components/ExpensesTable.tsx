"use client";

import { formatIRT } from "@/lib/format";
import { formatJalali } from "@/lib/dayjs";
import type { ExpenseRecord } from "@/hooks/useExpenses";

interface ExpensesTableProps {
  expenses: ExpenseRecord[];
  onRemove: (id: string) => void;
  onUndo: () => void;
  lastRemoved: ExpenseRecord | null;
}

export const ExpensesTable = ({ expenses, onRemove, onUndo, lastRemoved }: ExpensesTableProps) => {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">دفترچه هزینه‌ها</h3>
          <p className="text-sm text-slate-500">تاریخ‌ها به تقویم جلالی نمایش داده می‌شوند.</p>
        </div>
        {lastRemoved && (
          <button
            type="button"
            onClick={onUndo}
            className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
          >
            بازگردانی آخرین حذف
          </button>
        )}
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-100 text-right">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">شرح</th>
              <th className="px-6 py-3 font-medium">تاریخ</th>
              <th className="px-6 py-3 font-medium">مقدار ارزی</th>
              <th className="px-6 py-3 font-medium">معادل تومان</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                  هنوز هزینه‌ای ثبت نشده است.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-700">{expense.description}</td>
                  <td className="px-6 py-3">{formatJalali(expense.spentAt, "YYYY/MM/DD")}</td>
                  <td className="px-6 py-3">
                    {expense.amount.toLocaleString("fa-IR", {
                      maximumFractionDigits: expense.currency === "irt" ? 0 : 2
                    })}{" "}
                    {expense.currency.toUpperCase()}
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-800">{formatIRT(expense.irtValue)} تومان</td>
                  <td className="px-6 py-3 text-left">
                    <button
                      type="button"
                      onClick={() => onRemove(expense.id)}
                      className="rounded-xl border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
