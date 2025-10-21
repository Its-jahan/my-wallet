"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import type { RatesPayload } from "@/lib/rates-cache";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const error = new Error("Failed to fetch");
    throw Object.assign(error, { status: res.status });
  }
  return res.json();
};

export interface RatesResponse extends RatesPayload {
  error?: string;
}

export const useRates = () => {
  const { data, error, isValidating, mutate } = useSWR<RatesResponse>("/api/rates", fetcher, {
    refreshInterval: 45_000,
    dedupingInterval: 15_000,
    revalidateOnFocus: true
  });
  const [showStale, setShowStale] = useState(false);

  useEffect(() => {
    if (data?.stale) {
      setShowStale(true);
    } else if (data && !data.stale) {
      setShowStale(false);
    }
  }, [data]);

  const rates = useMemo(() => {
    if (!data) return null;
    const { error: _error, ...rest } = data;
    return rest;
  }, [data]);

  return {
    rates,
    error,
    isLoading: !data && !error,
    isValidating,
    mutate,
    showStale,
    clearStale: () => setShowStale(false),
    raw: data
  };
};
