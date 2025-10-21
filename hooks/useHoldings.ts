"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toIRT, type CurrencyCode, type RatesSnapshot } from "@/lib/conversion";
import { getSupabaseClient } from "@/lib/supabase-client";
import { toCurrencyCode } from "@/lib/currency";

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

const syncHoldingsToSupabase = async (holdings: HoldingRecord[]) => {
  const client = getSupabaseClient();
  if (!client) return false;

  const upsert = async (payload: any[]) => {
    const { error } = await client.from("wallet_holdings").upsert(payload, { onConflict: "id" });
    return error;
  };

  try {
    const basePayload = holdings.map((holding) => ({
      id: holding.id,
      title: holding.title,
      currency: toCurrencyCode(holding.currency),
      amount: holding.amount,
      irt_value: holding.irtValue,
      created_at: holding.createdAt
    }));

    const fallbackPayload = basePayload.map(({ created_at, ...rest }) => rest);

    const error = await upsert(basePayload);
    if (error) {
      if (error.code === "PGRST204") {
        const fallbackError = await upsert(fallbackPayload);
        if (fallbackError) {
          console.warn("Failed to sync holdings (fallback)", fallbackError);
          return false;
        }
        return true;
      }
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
}

export const useHoldings = ({ rates }: UseHoldingsOptions) => {
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
    void syncHoldingsToSupabase(holdings);
  }, [holdings]);

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
    return syncHoldingsToSupabase(holdings);
  }, [holdings]);

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
