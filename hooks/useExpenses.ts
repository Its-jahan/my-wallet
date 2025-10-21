"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toIRT, type CurrencyCode, type RatesSnapshot } from "@/lib/conversion";
import { getSupabaseClient } from "@/lib/supabase-client";
import { toCurrencyCode } from "@/lib/currency";

export interface ExpenseRecord {
  id: string;
  description: string;
  currency: CurrencyCode;
  amount: number;
  irtValue: number;
  spentAt: string;
  createdAt: string;
}

const STORAGE_KEY = "expenses:v1";

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const parseStoredExpenses = (value: string | null): ExpenseRecord[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item?.id === "string");
    }
    if (Array.isArray(parsed?.expenses)) {
      return parsed.expenses;
    }
  } catch (error) {
    console.error("Unable to parse expenses", error);
  }
  return [];
};

const persistExpenses = (expenses: ExpenseRecord[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
};

const toExpenseTimestamp = (value: string) => {
  if (!value) return null;
  const isoLike = value.includes("T") ? value : `${value}T00:00:00`;
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const syncExpensesToSupabase = async (expenses: ExpenseRecord[], userId?: string | null) => {
  if (!userId) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = expenses
      .map((expense) => {
        const expenseAt = toExpenseTimestamp(expense.spentAt);
        if (!expenseAt) return null;
        return {
          user_id: userId,
          currency: toCurrencyCode(expense.currency),
          amount: expense.amount,
          expense_at: expenseAt
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (payload.length === 0) return true;

    const { error } = await client
      .from("wallet_expenses")
      .upsert(payload, { onConflict: "user_id,expense_at", ignoreDuplicates: false })
      .select("user_id,currency,amount,expense_at");

    if (error) {
      console.warn("Failed to sync expenses", error);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Failed to sync expenses", error);
    return false;
  }
};

export interface UseExpensesOptions {
  rates?: RatesSnapshot | null;
  userId?: string | null;
}

export const useExpenses = ({ rates, userId }: UseExpensesOptions) => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [lastRemoved, setLastRemoved] = useState<ExpenseRecord | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || initialised.current) return;
    initialised.current = true;
    const stored = parseStoredExpenses(localStorage.getItem(STORAGE_KEY));
    setExpenses(stored);
  }, []);

  useEffect(() => {
    if (!initialised.current) return;
    persistExpenses(expenses);
    void syncExpensesToSupabase(expenses, userId);
  }, [expenses, userId]);

  const addExpense = useCallback(
    (input: { description: string; amount: number; currency: CurrencyCode; spentAt: string }) => {
      const irtValue = toIRT(input.amount, input.currency, rates ?? undefined);
      const next: ExpenseRecord = {
        id: createId(),
        description: input.description,
        amount: input.amount,
        currency: input.currency,
        irtValue,
        spentAt: input.spentAt,
        createdAt: new Date().toISOString()
      };
      setExpenses((prev) => [next, ...prev]);
      setLastRemoved(null);
    },
    [rates]
  );

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const target = prev.find((item) => item.id === id) ?? null;
      if (target) {
        setLastRemoved(target);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const undoRemove = useCallback(() => {
    if (!lastRemoved) return;
    setExpenses((prev) => [lastRemoved, ...prev]);
    setLastRemoved(null);
  }, [lastRemoved]);

  const importExpenses = useCallback((payload: string) => {
    try {
      const parsed = parseStoredExpenses(payload);
      if (parsed.length) {
        setExpenses(parsed);
        setLastRemoved(null);
      }
    } catch (error) {
      console.error("Invalid expenses import", error);
    }
  }, []);

  const exportExpenses = useCallback(() => {
    return JSON.stringify({ version: 1, expenses }, null, 2);
  }, [expenses]);

  const syncToSupabase = useCallback(() => {
    return syncExpensesToSupabase(expenses, userId);
  }, [expenses, userId]);

  const totals = useMemo(() => {
    return expenses.reduce(
      (acc, item) => {
        acc.irt += item.irtValue;
        acc.count += 1;
        return acc;
      },
      { irt: 0, count: 0 }
    );
  }, [expenses]);

  return {
    expenses,
    addExpense,
    removeExpense,
    undoRemove,
    lastRemoved,
    totals,
    importExpenses,
    exportExpenses,
    syncToSupabase
  };
};
