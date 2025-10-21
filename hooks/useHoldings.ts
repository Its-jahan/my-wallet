"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toIRT, type CurrencyCode, type RatesSnapshot } from "@/lib/conversion";
import { getSupabaseClient } from "@/lib/supabase-client";
import { toCurrencyCode, type DatabaseCurrencyCode } from "@/lib/currency";

export interface HoldingRecord {
  id: string;
  title: string;
  currency: CurrencyCode;
  amount: number;
  irtValue: number;
  createdAt: string;
}

const STORAGE_KEY = "holdings:v1";

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const parseStoredHoldings = (value: string | null): HoldingRecord[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item?.id === "string");
    }
    if (Array.isArray(parsed?.holdings)) {
      return parsed.holdings;
    }
  } catch (error) {
    console.error("Unable to parse holdings", error);
  }
  return [];
};

const persistHoldings = (holdings: HoldingRecord[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
};

const syncHoldingsToSupabase = async (holdings: HoldingRecord[], userId?: string | null) => {
  if (!userId) return false;
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const aggregated = holdings.reduce<Partial<Record<DatabaseCurrencyCode, number>>>((acc, holding) => {
      const currency = toCurrencyCode(holding.currency);
      acc[currency] = (acc[currency] ?? 0) + holding.amount;
      return acc;
    }, {});

    const payload = (Object.entries(aggregated) as Array<[DatabaseCurrencyCode, number]>).map(([currency, amount]) => ({
      user_id: userId,
      currency,
      amount
    }));

    if (payload.length === 0) return true;

    const { error } = await client
      .from("wallet_holdings")
      .upsert(payload, { onConflict: "user_id,currency" })
      .select("user_id,currency,amount,updated_at");

    if (error) {
      console.warn("Failed to sync holdings", error);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Failed to sync holdings", error);
    return false;
  }
};

export interface UseHoldingsOptions {
  rates?: RatesSnapshot | null;
  userId?: string | null;
}

export const useHoldings = ({ rates, userId }: UseHoldingsOptions) => {
  const [holdings, setHoldings] = useState<HoldingRecord[]>([]);
  const [lastRemoved, setLastRemoved] = useState<HoldingRecord | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || initialised.current) return;
    initialised.current = true;
    const stored = parseStoredHoldings(localStorage.getItem(STORAGE_KEY));
    setHoldings(stored);
  }, []);

  useEffect(() => {
    if (!initialised.current) return;
    persistHoldings(holdings);
    void syncHoldingsToSupabase(holdings, userId);
  }, [holdings, userId]);

  const addHolding = useCallback(
    (input: { title: string; amount: number; currency: CurrencyCode }) => {
      const irtValue = toIRT(input.amount, input.currency, rates ?? undefined);
      const next: HoldingRecord = {
        id: createId(),
        title: input.title,
        amount: input.amount,
        currency: input.currency,
        irtValue,
        createdAt: new Date().toISOString()
      };
      setHoldings((prev) => [next, ...prev]);
      setLastRemoved(null);
    },
    [rates]
  );

  const removeHolding = useCallback((id: string) => {
    setHoldings((prev) => {
      const target = prev.find((item) => item.id === id) ?? null;
      if (target) {
        setLastRemoved(target);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const undoRemove = useCallback(() => {
    if (!lastRemoved) return;
    setHoldings((prev) => [lastRemoved, ...prev]);
    setLastRemoved(null);
  }, [lastRemoved]);

  const importHoldings = useCallback((payload: string) => {
    try {
      const parsed = parseStoredHoldings(payload);
      if (parsed.length) {
        setHoldings(parsed);
        setLastRemoved(null);
      }
    } catch (error) {
      console.error("Invalid holdings import", error);
    }
  }, []);

  const exportHoldings = useCallback(() => {
    return JSON.stringify({ version: 1, holdings }, null, 2);
  }, [holdings]);

  const syncToSupabase = useCallback(() => {
    return syncHoldingsToSupabase(holdings, userId);
  }, [holdings, userId]);

  const totals = useMemo(() => {
    const summary = holdings.reduce(
      (acc, item) => {
        acc.irt += item.irtValue;
        acc.count += 1;
        return acc;
      },
      { irt: 0, count: 0 }
    );
    return summary;
  }, [holdings]);

  return {
    holdings,
    addHolding,
    removeHolding,
    undoRemove,
    lastRemoved,
    totals,
    importHoldings,
    exportHoldings,
    syncToSupabase
  };
};
