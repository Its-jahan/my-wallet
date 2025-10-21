const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

const formatDigits = (value: string) =>
  value.replace(/[0-9]/g, (d) => persianDigits[Number(d)] ?? d);

export const formatIRT = (value: number) => {
  const normalized = Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
  const formatter = new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  return formatDigits(formatter.format(normalized));
};

export const formatCurrency = (value: number, currency: string) => {
  const fractionDigits = currency === "irt" ? 1 : 2;
  const formatter = new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
  const normalized = Number.isFinite(value) ? value : 0;
  return formatDigits(formatter.format(normalized));
};

export const parseNumeric = (value: string) => {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^0-9.]/g, "");
  return normalized ? Number(normalized) : 0;
};
