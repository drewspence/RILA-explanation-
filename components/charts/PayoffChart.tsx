"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Label,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { pct, currency } from "@/lib/formatters";
import { StrategyConfig, StrategyInputs } from "@/types/strategy";
import { buildChartDomain } from "@/lib/calculations/payoffVisualization";
import { computeEndingValue } from "@/lib/calculations/strategies";

interface Props {
  strategy: StrategyConfig;
  inputs: StrategyInputs;
  data: Array<{ market: number; credited: number }>;
  marketReturn: number;
  creditedReturn: number;
  startingPremium: number;
  endingValue: number;
  scenarioExplanation: string;
}

export function PayoffChart({
  strategy,
  inputs,
  data,
  marketReturn,
  creditedReturn,
  startingPremium,
  endingValue,
  scenarioExplanation
}: Props) {
  const thresholds = [marketReturn, creditedReturn, -(inputs.buffer ?? 0), inputs.cap ?? 0, inputs.floor ?? 0, 0];
  const domain = buildChartDomain(data, thresholds);

  const regions = getStrategyRegions(strategy.id, inputs, domain);
  const markers = getThresholdMarkers(strategy.id, inputs);
  const markerCount = markers.length;
  const bubblePositionClass = marketReturn >= 0.2 ? "right-6 top-6" : "left-6 top-6";

  return (
    <div className="space-y-4">
      <header className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Payoff chart</p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Structured Outcome Diagram</h3>
        </div>
      </header>

      <div data-testid="payoff-chart" className="relative h-[640px] w-full overflow-hidden rounded-[24px] border border-slate-300 bg-gradient-to-b from-white to-slate-100 p-4">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 44, right: 92, bottom: 56, left: 74 }}>
            <CartesianGrid strokeDasharray="3 7" stroke="#cbd5e1" />

            {regions.map((zone) => (
              <ReferenceArea key={zone.label} x1={zone.x1} x2={zone.x2} y1={zone.y1} y2={zone.y2} fill={zone.fill} fillOpacity={zone.opacity} />
            ))}

            {markers.map((line, index) => (
              <ReferenceLine key={line.label} {...(line.axis === "x" ? { x: line.value } : { y: line.value })} stroke={line.color} strokeWidth={2} strokeDasharray={line.dashed ? "6 4" : undefined}>
                <Label value={line.label} fill={line.color} fontWeight={700} fontSize={11} position={line.position} dy={line.axis === "y" ? -12 + index * (markerCount > 3 ? 10 : 12) : undefined} />
              </ReferenceLine>
            ))}

            <XAxis
              type="number"
              dataKey="market"
              domain={domain.x}
              tickFormatter={pct}
              label={{ value: "Market return", dy: 26, fill: "#0f172a", fontWeight: 600 }}
              tick={{ fill: "#334155", fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="credited"
              domain={domain.y}
              tickFormatter={pct}
              label={{ value: "Credited return", angle: -90, dx: -48, fill: "#0f172a", fontWeight: 600 }}
              tick={{ fill: "#334155", fontSize: 12 }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const market = Number(label ?? 0);
                const credited = Number(payload[0]?.value ?? 0);
                const projectedEndingValue = computeEndingValue(startingPremium, credited);
                return (
                  <div className="rounded-xl border border-slate-300 bg-white/95 p-3 text-xs shadow-2xl backdrop-blur">
                    <p><strong>Market move:</strong> {pct(market)}</p>
                    <p><strong>Credited result:</strong> {pct(credited)}</p>
                    <p><strong>Ending value:</strong> {currency(projectedEndingValue)}</p>
                  </div>
                );
              }}
            />

            <Area type="monotone" dataKey="credited" stroke="none" fill="url(#premiumFill)" fillOpacity={0.9} isAnimationActive={false} />
            <Line type="monotone" dataKey="credited" stroke="#0f172a" strokeWidth={4} dot={false} isAnimationActive={false} />
            <ReferenceDot x={marketReturn} y={creditedReturn} r={7} fill="#0f172a" stroke="#fff" strokeWidth={2} ifOverflow="extendDomain" isFront />

            <defs>
              <linearGradient id="premiumFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity={0.05} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>

        <div data-testid="active-scenario-card" className={`pointer-events-none absolute max-w-[260px] rounded-xl border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-white shadow-2xl ${bubblePositionClass}`}>
          <p className="font-semibold">Active scenario</p>
          <p className="mt-1">Market move: {pct(marketReturn)}</p>
          <p>Credited result: {pct(creditedReturn)}</p>
          <p>Ending value: {currency(endingValue)}</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-5">
        {regions.map((region) => (
          <div key={`pill-${region.label}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{region.label}</div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What this means</p>
        <p className="mt-2">{scenarioExplanation}</p>
      </section>
    </div>
  );
}

type Region = {
  label: string;
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
  fill: string;
  opacity: number;
};

type Marker = {
  axis: "x" | "y";
  value: number;
  label: string;
  color: string;
  dashed?: boolean;
  position: "insideTopLeft" | "insideTopRight" | "left" | "right";
};

function getStrategyRegions(strategyId: string, inputs: StrategyInputs, domain: { x: [number, number]; y: [number, number] }): Region[] {
  const buffer = inputs.buffer ?? 0;
  const cap = inputs.cap ?? domain.y[1];
  const floor = inputs.floor ?? domain.y[0];

  if (strategyId === "guard") {
    return [
      { label: "Floor", x1: domain.x[0], x2: domain.x[1], y1: domain.y[0], y2: floor, fill: "#fecaca", opacity: 0.38 },
      { label: "Growth", x1: 0, x2: cap, fill: "#bfdbfe", opacity: 0.28 },
      { label: "Cap", y1: cap, y2: domain.y[1], fill: "#dbeafe", opacity: 0.38 },
      { label: "Loss zone", x1: domain.x[0], x2: 0, y1: floor, y2: 0, fill: "#fee2e2", opacity: 0.25 }
    ];
  }

  if (["precision", "dualPrecision", "protectionTrigger"].includes(strategyId)) {
    return [
      { label: "Loss zone", x1: domain.x[0], x2: -buffer, y1: domain.y[0], y2: 0, fill: "#fecaca", opacity: 0.4 },
      { label: "Trigger", x1: strategyId === "dualPrecision" ? -buffer : 0, x2: domain.x[1], y1: 0, y2: inputs.triggerRate ?? 0.06, fill: "#bbf7d0", opacity: 0.3 },
      { label: "Buffer", x1: -buffer, x2: 0, y1: -0.02, y2: 0.06, fill: "#a7f3d0", opacity: 0.25 },
      { label: "Growth", x1: 0, x2: domain.x[1], y1: 0, y2: domain.y[1], fill: "#dbeafe", opacity: 0.16 }
    ];
  }

  if (["protectionCap"].includes(strategyId)) {
    return [
      { label: "Principal", x1: domain.x[0], x2: 0, y1: 0, y2: 0.05, fill: "#a7f3d0", opacity: 0.35 },
      { label: "Growth", x1: 0, x2: inputs.cap ?? 0.08, y1: 0, y2: inputs.cap ?? 0.08, fill: "#bfdbfe", opacity: 0.24 },
      { label: "Cap", y1: inputs.cap ?? 0.08, y2: domain.y[1], fill: "#dbeafe", opacity: 0.36 }
    ];
  }

  return [
    { label: "Loss zone", x1: domain.x[0], x2: -buffer, y1: domain.y[0], y2: 0, fill: "#fecaca", opacity: 0.4 },
    { label: "Buffer", x1: -buffer, x2: 0, y1: -0.02, y2: 0.06, fill: "#a7f3d0", opacity: 0.25 },
    { label: "Growth", x1: 0, x2: domain.x[1], y1: 0, y2: inputs.cap ?? domain.y[1], fill: "#bfdbfe", opacity: 0.18 },
    { label: "Cap", y1: cap, y2: domain.y[1], fill: "#dbeafe", opacity: 0.36 }
  ];
}

function getThresholdMarkers(strategyId: string, inputs: StrategyInputs): Marker[] {
  const markers: Marker[] = [
    { axis: "x", value: 0, label: "0% market", color: "#334155", dashed: true, position: "insideTopLeft" },
    { axis: "y", value: 0, label: "Zero credit", color: "#334155", dashed: true, position: "right" }
  ];

  if (inputs.buffer) {
    markers.push({ axis: "x", value: -inputs.buffer, label: "Buffer", color: "#0f766e", position: "insideTopLeft" });
  }
  if (inputs.cap) {
    markers.push({ axis: "y", value: inputs.cap, label: "Cap", color: "#1d4ed8", position: "right" });
  }
  if (inputs.floor) {
    markers.push({ axis: "y", value: inputs.floor, label: "Floor", color: "#b91c1c", position: "left" });
  }
  if (inputs.triggerRate && ["precision", "dualPrecision", "protectionTrigger"].includes(strategyId)) {
    markers.push({ axis: "y", value: inputs.triggerRate, label: "Trigger", color: "#166534", position: "left" });
  }

  return markers;
}
