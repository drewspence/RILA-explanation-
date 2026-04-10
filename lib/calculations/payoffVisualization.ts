import { applyFee, computeEndingValue } from "./strategies";
import { StrategyConfig, StrategyId, StrategyInputs } from "../../types/strategy";

export interface PayoffPoint {
  market: number;
  credited: number;
}

export interface ChartZone {
  kind: "buffer" | "cap" | "floor";
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
  label: string;
}

export interface ChartReferenceLine {
  axis: "x" | "y";
  value: number;
  label: string;
  kind: "neutral" | "cap" | "floor" | "trigger";
}

export interface PayoffChartMeta {
  zones: ChartZone[];
  lines: ChartReferenceLine[];
  notes: string[];
}

export const PAYOFF_RANGE = { min: -0.5, max: 0.5, step: 0.01 };

export function buildPayoffSeries(
  config: StrategyConfig,
  inputs: StrategyInputs,
  feeEnabled: boolean,
  annualFee: number
): PayoffPoint[] {
  const points: PayoffPoint[] = [];
  for (let i = Math.round(PAYOFF_RANGE.min * 100); i <= Math.round(PAYOFF_RANGE.max * 100); i += 1) {
    const market = i / 100;
    const gross = config.calculate(market, inputs);
    const credited = applyFee(gross, feeEnabled, annualFee);
    if (Number.isFinite(credited)) {
      points.push({ market, credited });
    }
  }
  return points;
}

export function getScenarioPoint(
  config: StrategyConfig,
  inputs: StrategyInputs,
  marketReturn: number,
  feeEnabled: boolean,
  annualFee: number,
  startingPremium: number
) {
  const gross = config.calculate(marketReturn, inputs);
  const credited = applyFee(gross, feeEnabled, annualFee);
  const endingValue = computeEndingValue(startingPremium, credited);

  return { market: marketReturn, credited, endingValue };
}

export function buildPayoffChartMeta(strategyId: StrategyId, inputs: StrategyInputs): PayoffChartMeta {
  const buffer = Math.max(0, inputs.buffer ?? 0);
  const cap = inputs.cap;
  const floor = inputs.floor;
  const triggerRate = inputs.triggerRate;
  const participationRate = inputs.participationRate;

  const zones: ChartZone[] = [];
  const lines: ChartReferenceLine[] = [
    { axis: "x", value: 0, label: "0% market return", kind: "neutral" },
    { axis: "y", value: 0, label: "0% credited return", kind: "neutral" }
  ];
  const notes: string[] = [];

  const hasBuffer = ["performanceCap", "performanceParticipation", "precision", "dualPrecision"].includes(strategyId);
  if (hasBuffer && buffer > 0) {
    zones.push({ kind: "buffer", x1: -buffer, x2: 0, label: `Buffer zone: first ${(buffer * 100).toFixed(0)}% of loss absorbed` });
    notes.push(`Shaded vertical zone shows the first ${(buffer * 100).toFixed(0)}% of market loss absorbed.`);
  }

  if (["performanceCap", "guard", "protectionCap"].includes(strategyId) && typeof cap === "number") {
    lines.push({ axis: "y", value: cap, label: "Cap", kind: "cap" });
    zones.push({ kind: "cap", y1: cap, y2: PAYOFF_RANGE.max, label: `Cap: gains above ${(cap * 100).toFixed(0)}% do not increase credited return` });
    notes.push(`Horizontal ceiling shows the cap at ${(cap * 100).toFixed(1)}%; additional market gains above that level do not increase credited return.`);
  }

  if (strategyId === "guard" && typeof floor === "number") {
    lines.push({ axis: "y", value: floor, label: "Floor", kind: "floor" });
    zones.push({ kind: "floor", y1: PAYOFF_RANGE.min, y2: floor, label: `Floor: credited return will not drop below ${(floor * 100).toFixed(0)}%` });
    notes.push(`Downside is limited by the floor at ${(floor * 100).toFixed(1)}%, even if markets fall more.`);
  }

  if (["precision", "dualPrecision", "protectionTrigger"].includes(strategyId) && typeof triggerRate === "number") {
    lines.push({ axis: "y", value: triggerRate, label: "Trigger credit", kind: "trigger" });
    notes.push(`Flat payoff section highlights the trigger credit of ${(triggerRate * 100).toFixed(1)}% when conditions are met.`);
  }

  if (strategyId === "performanceParticipation") {
    notes.push(`Participation rate is ${(participationRate ?? 1).toFixed(2)}×, which changes the slope of the upside payoff line.`);
  }

  if (strategyId === "dualPrecision") {
    notes.push("Flat segment from modest down markets through up markets shows the fixed credit inside the buffer range.");
  }

  return { zones, lines, notes };
}

export function buildChartDomain(points: PayoffPoint[], thresholds: number[]) {
  const markets = points.map((point) => point.market);
  const credited = points.map((point) => point.credited);
  const xValues = [...markets, ...thresholds.filter((v) => Number.isFinite(v))];
  const yValues = [...credited, ...thresholds.filter((v) => Number.isFinite(v))];

  const xMin = Math.min(...xValues, PAYOFF_RANGE.min);
  const xMax = Math.max(...xValues, PAYOFF_RANGE.max);
  const yMin = Math.min(...yValues, PAYOFF_RANGE.min);
  const yMax = Math.max(...yValues, PAYOFF_RANGE.max);

  return {
    x: [Math.floor((xMin - 0.02) * 100) / 100, Math.ceil((xMax + 0.02) * 100) / 100] as [number, number],
    y: [Math.floor((yMin - 0.02) * 100) / 100, Math.ceil((yMax + 0.02) * 100) / 100] as [number, number]
  };
}
