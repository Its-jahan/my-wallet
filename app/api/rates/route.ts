import { NextResponse } from "next/server";
import { getRatesCache, RatesPayload } from "@/lib/rates-cache";

const NAVASAN_ITEMS = "usd,eur,usdt";
const RECOVERABLE_STATUSES = new Set([401, 422, 429, 503]);

const toIRTValue = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(String(value ?? "0"));
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.round(num / 10);
};

const buildPayload = (data: any): Omit<RatesPayload, "stale"> => {
  return {
    usdIRT: toIRTValue(data?.usd?.value ?? data?.usd?.price),
    eurIRT: toIRTValue(data?.eur?.value ?? data?.eur?.price),
    usdtIRT: toIRTValue(data?.usdt?.value ?? data?.usdt?.price),
    lastUpdated: new Date().toISOString()
  };
};

export async function GET() {
  const cache = getRatesCache();
  const now = Date.now();
  const apiKey = process.env.NAVASAN_API_KEY;

  if (!apiKey) {
    const snapshot = cache.getSnapshot(true);
    if (snapshot) {
      return NextResponse.json({ ...snapshot, stale: true, error: "NAVASAN_API_KEY missing" });
    }
    return NextResponse.json(
      { error: "NAVASAN_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!cache.shouldRequest(now)) {
    const snapshot = cache.getSnapshot();
    if (snapshot) {
      return NextResponse.json(snapshot, { headers: { "cache-control": "no-store" } });
    }
  }

  try {
    const endpoint = new URL("https://api.navasan.tech/latest/");
    endpoint.searchParams.set("item", NAVASAN_ITEMS);
    endpoint.searchParams.set("api_key", apiKey);

    const response = await fetch(endpoint, {
      next: { revalidate: 0 },
      cache: "no-store"
    });

    if (!response.ok) {
      if (RECOVERABLE_STATUSES.has(response.status)) {
        const fallback = cache.recordFailure(response.status, now);
        if (fallback) {
          return NextResponse.json(fallback, {
            headers: { "cache-control": "no-store" },
            status: 200
          });
        }
        return NextResponse.json(
          { error: "Failed to fetch rates", stale: true },
          { status: response.status }
        );
      }

      return NextResponse.json(
        { error: "Unexpected error from upstream" },
        { status: response.status }
      );
    }

    const payload = buildPayload(await response.json());
    cache.recordSuccess(payload, now);
    return NextResponse.json({ ...payload, stale: false }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const fallback = cache.recordFailure(undefined, now);
    if (fallback) {
      return NextResponse.json(fallback, {
        headers: { "cache-control": "no-store" },
        status: 200
      });
    }

    return NextResponse.json(
      { error: "Unable to connect to rate provider", stale: true },
      { status: 503 }
    );
  }
}
