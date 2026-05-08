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
  labelPosition?: "insideTopLeft" | "insideTopRight" | "insideBottomLeft";
}

export interface ChartReferenceLine {
  axis: "x" | "y";
  value: number;
  label: string;
  kind: "neutral" | "cap" | "floor" | "trigger";
  labelPosition?: "insideTopLeft" | "insideTopRight" | "right" | "left";
}

export interface PayoffChartMeta {
  zones: ChartZone[];
  lines: ChartReferenceLine[];
  notes: string[];
}

export const PAYOFF_RANGE = { min: -0.5, max: 0.5, step: 0.01 };

export function buildPayoffSeries(config: StrategyConfig, inputs: StrategyInputs): PayoffPoint[] {
  const points: PayoffPoint[] = [];
  for (let i = Math.round(PAYOFF_RANGE.min * 100); i <= Math.round(PAYOFF_RANGE.max * 100); i += 1) {
    const market = i / 100;
    const credited = config.calculate(market, inputs);
    if (Number.isFinite(credited)) {
      points.push({ market, credited });
    }
  }
  return points;
}

export function buildPayoffChartMeta(strategyId: StrategyId, inputs: StrategyInputs): PayoffChartMeta {
  const buffer = Math.max(0, inputs.buffer ?? 0);
  const cap = inputs.cap;
  const floor = inputs.floor;
  const triggerRate = inputs.triggerRate;

  const zones: ChartZone[] = [];
  const lines: ChartReferenceLine[] = [
    { axis: "x", value: 0, label: "0% market", kind: "neutral", labelPosition: "insideTopLeft" },
    { axis: "y", value: 0, label: "0% credited", kind: "neutral", labelPosition: "right" }
  ];
  const notes: string[] = [];

  const hasBuffer = ["performanceCap", "performanceParticipation", "precision", "dualPrecision"].includes(strategyId);
  if (hasBuffer && buffer > 0) {
    zones.push({ kind: "buffer", x1: -buffer, x2: 0, label: `${(buffer * 100).toFixed(0)}% buffer`, labelPosition: "insideTopLeft" });
    notes.push(`The shaded buffer zone absorbs the first ${(buffer * 100).toFixed(0)}% of market loss.`);
  }

  if (["performanceCap", "guard", "protectionCap"].includes(strategyId) && typeof cap === "number") {
    lines.push({ axis: "y", value: cap, label: "Cap", kind: "cap", labelPosition: "right" });
    zones.push({ kind: "cap", y1: cap, y2: PAYOFF_RANGE.max, label: "Cap zone", labelPosition: "insideTopRight" });
    notes.push(`Upside is capped at ${(cap * 100).toFixed(1)}%.`);
  }

  if (strategyId === "guard" && typeof floor === "number") {
    lines.push({ axis: "y", value: floor, label: "Floor", kind: "floor", labelPosition: "left" });
    zones.push({ kind: "floor", y1: PAYOFF_RANGE.min, y2: floor, label: "Floor zone", labelPosition: "insideBottomLeft" });
    notes.push(`The floor limits downside to ${(floor * 100).toFixed(1)}%.`);
  }

  if (["precision", "dualPrecision", "protectionTrigger"].includes(strategyId) && typeof triggerRate === "number") {
    lines.push({ axis: "y", value: triggerRate, label: "Trigger", kind: "trigger", labelPosition: "left" });
    notes.push(`Trigger credit is ${(triggerRate * 100).toFixed(1)}% when strategy conditions are met.`);
  }

  if (strategyId === "performanceParticipation") {
    notes.push(`Participation rate changes the slope of the upside line.`);
  }

  if (strategyId === "dualPrecision") {
    notes.push("Dual Precision can still credit the trigger in modestly negative years inside the buffer.");
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

export interface ClientFriendlyScenario {
  title: string;
  market: number;
  credited: number;
  note: string;
  referenceLine?: {
    label: string;
    value: number;
  };
}

const clampMarketScenario = (value: number) => Math.max(PAYOFF_RANGE.min, Math.min(PAYOFF_RANGE.max, value));

export function buildClientFriendlyScenarios(config: StrategyConfig, inputs: StrategyInputs): ClientFriendlyScenario[] {
  const buffer = Math.max(0, inputs.buffer ?? config.defaults.buffer ?? 0.1);
  const cap = inputs.cap ?? config.defaults.cap;
  const floor = inputs.floor ?? config.defaults.floor;
  const triggerRate = inputs.triggerRate ?? config.defaults.triggerRate;

  if (config.protectionType.includes("Buffer")) {
    const withinBufferMarket = -Math.min(buffer, 0.1);
    const beyondBufferMarket = clampMarketScenario(-(buffer + 0.15));
    const positiveMarket = clampMarketScenario(typeof cap === "number" ? cap + 0.06 : 0.18);

    return [
      {
        title: "Market down within buffer",
        market: withinBufferMarket,
        credited: config.calculate(withinBufferMarket, inputs),
        note: config.id === "dualPrecision" ? "Buffer applies; trigger may still credit" : "Loss absorbed by buffer",
        referenceLine: { label: "Buffer", value: -buffer }
      },
      {
        title: "Market down beyond buffer",
        market: beyondBufferMarket,
        credited: config.calculate(beyondBufferMarket, inputs),
        note: "Client only participates after buffer is exceeded",
        referenceLine: { label: "Buffer", value: -buffer }
      },
      {
        title: typeof cap === "number" ? "Market positive but capped" : "Market is positive",
        market: positiveMarket,
        credited: config.calculate(positiveMarket, inputs),
        note: typeof cap === "number" ? "Growth limited at cap" : "Upside rule determines credit",
        referenceLine: typeof cap === "number" ? { label: "Cap", value: cap } : triggerRate ? { label: "Trigger", value: triggerRate } : undefined
      }
    ];
  }

  if (config.id === "guard") {
    const floorValue = floor ?? -0.1;
    const capValue = cap ?? 0.12;
    const belowFloorMarket = clampMarketScenario(floorValue - 0.15);
    const moderateDownMarket = Math.min(-0.05, floorValue / 2);
    const positiveMarket = clampMarketScenario(capValue + 0.06);

    return [
      {
        title: "Market down moderately",
        market: moderateDownMarket,
        credited: config.calculate(moderateDownMarket, inputs),
        note: "Client follows market above floor",
        referenceLine: { label: "Floor", value: floorValue }
      },
      {
        title: "Market down beyond floor",
        market: belowFloorMarket,
        credited: config.calculate(belowFloorMarket, inputs),
        note: "Loss limited at floor",
        referenceLine: { label: "Floor", value: floorValue }
      },
      {
        title: "Market positive but capped",
        market: positiveMarket,
        credited: config.calculate(positiveMarket, inputs),
        note: "Growth limited at cap",
        referenceLine: { label: "Cap", value: capValue }
      }
    ];
  }

  const capValue = cap ?? 0.07;
  const triggerValue = triggerRate ?? 0.04;
  const hasCap = config.requiredInputs.includes("cap");
  const positiveMarket = hasCap ? clampMarketScenario(capValue + 0.06) : 0.12;
  const positiveReference = hasCap ? { label: "Cap", value: capValue } : { label: "Trigger", value: triggerValue };

  return [
    {
      title: "Market is negative",
      market: -0.18,
      credited: config.calculate(-0.18, inputs),
      note: "Negative index return credits 0%",
      referenceLine: { label: "0% floor", value: 0 }
    },
    {
      title: "Market is flat",
      market: 0,
      credited: config.calculate(0, inputs),
      note: hasCap ? "No market gain to credit" : "Trigger can credit when flat",
      referenceLine: positiveReference
    },
    {
      title: hasCap ? "Market positive but capped" : "Market is positive",
      market: positiveMarket,
      credited: config.calculate(positiveMarket, inputs),
      note: hasCap ? "Growth limited at cap" : "Positive return receives trigger credit",
      referenceLine: positiveReference
    }
  ];
}
