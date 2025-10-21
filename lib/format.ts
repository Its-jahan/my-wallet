const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

const formatDigits = (value: string) =>
  value.replace(/[0-9]/g, (d) => persianDigits[Number(d)] ?? d);

export const formatIRT = (value: number) => {
  const formatter = new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 0
  });
  return formatDigits(formatter.format(Math.round(value)));
};

export const formatCurrency = (value: number, currency: string) => {
  const formatter = new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: currency === "irt" ? 0 : 2
  });
  return formatDigits(formatter.format(value));
};

export const parseNumeric = (value: string) => {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^0-9.]/g, "");
  return normalized ? Number(normalized) : 0;
};
