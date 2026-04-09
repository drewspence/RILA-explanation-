export const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

export const currency = (value: number, roundToDollar = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: roundToDollar ? 0 : 2,
    minimumFractionDigits: roundToDollar ? 0 : 2
  }).format(value);
