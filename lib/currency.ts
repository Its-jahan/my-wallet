export const DATABASE_CURRENCIES = ["IRT", "USD", "USDT", "EUR"] as const;

export type DatabaseCurrencyCode = (typeof DATABASE_CURRENCIES)[number];

export const toCurrencyCode = (value: string): DatabaseCurrencyCode => {
  const upper = value.toUpperCase();
  if ((DATABASE_CURRENCIES as readonly string[]).includes(upper)) {
    return upper as DatabaseCurrencyCode;
  }
  throw new Error(`Unsupported currency: ${value}`);
};

export const tryCurrencyCode = (value: string) => {
  try {
    return toCurrencyCode(value);
  } catch {
    return null;
  }
};
