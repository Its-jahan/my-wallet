export type CurrencyCode = "usd" | "eur" | "usdt" | "irt";

export interface RatesSnapshot {
  usdIRT: number;
  eurIRT: number;
  usdtIRT: number;
}

const roundToToman = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
};

const currencyToKey: Record<Exclude<CurrencyCode, "irt">, keyof RatesSnapshot> = {
  usd: "usdIRT",
  eur: "eurIRT",
  usdt: "usdtIRT"
};

export const toIRT = (
  amount: number,
  currency: CurrencyCode,
  rates?: RatesSnapshot | null
) => {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  if (currency === "irt") return roundToToman(amount);
  if (!rates) return 0;
  const key = currencyToKey[currency];
  const rate = rates[key];
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return roundToToman(amount * rate);
};

export const convertToCurrency = (
  irtAmount: number,
  currency: CurrencyCode,
  rates?: RatesSnapshot | null
) => {
  if (currency === "irt" || !rates) return irtAmount;
  const key = currencyToKey[currency];
  const rate = rates[key];
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return irtAmount / rate;
};

export const roundTomanValue = roundToToman;
