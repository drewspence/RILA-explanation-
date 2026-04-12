const trimZeros = (value: string) => value.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

export const pct = (value: number, digits = 1) => `${trimZeros((value * 100).toFixed(digits))}%`;

export const pctInput = (decimal: number, digits = 2) => trimZeros((decimal * 100).toFixed(digits));

export const uiPercentToDecimal = (percent: number) => percent / 100;

export const decimalToUiPercent = (decimal: number) => decimal * 100;

export const currency = (value: number, roundToDollar = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: roundToDollar ? 0 : 2,
    minimumFractionDigits: roundToDollar ? 0 : 2
  }).format(value);
