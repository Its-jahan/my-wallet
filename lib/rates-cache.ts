export interface RatesPayload {
  usdIRT: number;
  eurIRT: number;
  usdtIRT: number;
  lastUpdated: string;
  stale: boolean;
}

interface CacheEntry {
  data: RatesPayload;
  fetchedAt: number;
  failedAttempts: number;
  nextRetryAt: number;
  status: "ok" | "error";
  lastStatusCode?: number;
}

class RatesCache {
  private latest: CacheEntry | null = null;
  private history: CacheEntry[] = [];
  private readonly ttl = 24 * 60 * 60 * 1000;
  private readonly historyLimit = 10;

  shouldRequest(now: number) {
    if (!this.latest) return true;
    return now >= this.latest.nextRetryAt;
  }

  recordSuccess(data: Omit<RatesPayload, "stale">, now: number) {
    const entry: CacheEntry = {
      data: { ...data, stale: false },
      fetchedAt: now,
      failedAttempts: 0,
      nextRetryAt: now + this.ttl,
      status: "ok"
    };
    this.latest = entry;
    this.history = [entry, ...this.history].slice(0, this.historyLimit);
  }

  recordFailure(statusCode: number | undefined, now: number) {
    if (!this.latest) {
      this.latest = {
        data: {
          usdIRT: 0,
          eurIRT: 0,
          usdtIRT: 0,
          lastUpdated: new Date(now).toISOString(),
          stale: true
        },
        fetchedAt: now,
        failedAttempts: 1,
        nextRetryAt: now + 5000,
        status: "error",
        lastStatusCode: statusCode
      };
      this.history = [this.latest];
      return null;
    }

    const attempts = this.latest.failedAttempts + 1;
    const wait = Math.min(5 * 1000 * 2 ** (attempts - 1), 5 * 60 * 1000);
    this.latest = {
      ...this.latest,
      failedAttempts: attempts,
      nextRetryAt: now + wait,
      status: "error",
      lastStatusCode: statusCode,
      data: { ...this.latest.data, stale: true }
    };
    this.history = [this.latest, ...this.history].slice(0, this.historyLimit);
    return this.latest.data;
  }

  getSnapshot(stale = false) {
    if (!this.latest) return null;
    return { ...this.latest.data, stale: stale || this.latest.data.stale };
  }

  getMetadata() {
    return {
      latest: this.latest,
      history: this.history
    };
  }
}

const cache = new RatesCache();

export const getRatesCache = () => cache;
