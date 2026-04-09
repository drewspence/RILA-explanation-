import { StrategyInputs } from "@/types/strategy";

const bounded = (value: number, min = -1, max = 1) => Math.min(max, Math.max(min, value));

export const performanceWithCap = (r: number, { buffer = 0.1, cap = 0.12 }: StrategyInputs) => {
  if (r >= 0) return Math.min(r, cap);
  return Math.abs(r) <= buffer ? 0 : r + buffer;
};

export const performanceWithParticipation = (
  r: number,
  { buffer = 0.1, participationRate = 1 }: StrategyInputs
) => {
  if (r >= 0) return r * participationRate;
  return Math.abs(r) <= buffer ? 0 : r + buffer;
};

export const precision = (r: number, { buffer = 0.1, triggerRate = 0.09 }: StrategyInputs) => {
  if (r >= 0) return triggerRate;
  if (r >= -buffer) return 0;
  return r + buffer;
};

export const dualPrecision = (r: number, { buffer = 0.1, triggerRate = 0.08 }: StrategyInputs) =>
  r >= -buffer ? triggerRate : r + buffer;

export const guard = (r: number, { cap = 0.12, floor = -0.1 }: StrategyInputs) =>
  r >= 0 ? Math.min(r, cap) : Math.max(r, floor);

export const protectionTrigger = (r: number, { triggerRate = 0.04 }: StrategyInputs) =>
  r >= 0 ? triggerRate : 0;

export const protectionCap = (r: number, { cap = 0.07 }: StrategyInputs) => (r >= 0 ? Math.min(r, cap) : 0);

export const applyFee = (creditedReturn: number, feeEnabled: boolean, annualFee: number) =>
  feeEnabled ? creditedReturn - annualFee : creditedReturn;

export const computeEndingValue = (startingPremium: number, netCreditedReturn: number) =>
  Math.max(0, startingPremium * (1 + bounded(netCreditedReturn, -1, 2)));
