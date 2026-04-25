"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Label,
  Line,
  ReferenceArea,
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

  const xPct = ((marketReturn - domain.x[0]) / (domain.x[1] - domain.x[0])) * 100;
  const yPct = ((domain.y[1] - creditedReturn) / (domain.y[1] - domain.y[0])) * 100;

  return (
    <div className="space-y-4">
      <header className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-8 text-[30px] font-medium text-slate-600">
            <span className="inline-flex items-center gap-2"><span className="h-1 w-10 rounded-full bg-blue-900" />Your Strategy Return</span>
            <span className="inline-flex items-center gap-2"><span className="h-1 w-10 rounded-full border-t-4 border-dashed border-slate-400" />Market Return</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{scenarioExplanation}</div>
      </header>

      <div className="relative h-[720px] w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white p-3">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 26, right: 55, bottom: 36, left: 22 }}>
            <CartesianGrid strokeDasharray="3 7" stroke="#dbe3ef" />

            {regions.map((zone) => (
              <ReferenceArea key={zone.label} x1={zone.x1} x2={zone.x2} y1={zone.y1} y2={zone.y2} fill={zone.fill} fillOpacity={zone.opacity}>
                <Label value={zone.label} position={zone.labelPosition} fill={zone.labelColor} fontSize={12} fontWeight={600} />
              </ReferenceArea>
            ))}

            {markers.map((line) => (
              <ReferenceLine key={line.label} {...(line.axis === "x" ? { x: line.value } : { y: line.value })} stroke={line.color} strokeWidth={2.4} strokeDasharray={line.dashed ? "6 4" : undefined}>
                <Label value={line.label} fill={line.color} fontWeight={700} fontSize={11} position={line.position} />
              </ReferenceLine>
            ))}

            <XAxis
              type="number"
              dataKey="market"
              domain={domain.x}
              tickFormatter={pct}
              label={{ value: "Market Return", dy: 16, fill: "#0f172a", fontWeight: 600 }}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="credited"
              domain={domain.y}
              tickFormatter={pct}
              label={{ value: "Return", angle: -90, dx: -6, fill: "#0f172a", fontWeight: 600 }}
              tick={{ fill: "#64748b", fontSize: 12 }}
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

            <Line type="monotone" dataKey="market" stroke="#b8c2d6" strokeDasharray="7 5" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="credited" stroke="none" fill="url(#premiumFill)" fillOpacity={0.45} isAnimationActive={false} />
            <Line type="monotone" dataKey="credited" stroke="#0b3186" strokeWidth={4} dot={false} isAnimationActive={false} />

            <defs>
              <linearGradient id="premiumFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0.01} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-2xl" style={{ left: `${clamp(xPct, 3, 97)}%`, top: `${clamp(yPct, 7, 93)}%` }} />

        <div className="pointer-events-none absolute max-w-[280px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-2xl" style={{ left: `${clamp(xPct + 2, 6, 75)}%`, top: `${clamp(yPct - 4, 8, 80)}%` }}>
          <p className="font-semibold">Active scenario</p>
          <p className="mt-1">Market move: {pct(marketReturn)}</p>
          <p>Credited result: {pct(creditedReturn)}</p>
          <p>Ending value: {currency(endingValue)}</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        {regions.map((region) => (
          <div key={`pill-${region.label}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{region.label}</div>
        ))}
      </div>
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
  labelColor: string;
  labelPosition: "insideTopLeft" | "insideTopRight" | "insideBottomLeft" | "insideBottomRight";
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
      { label: "Floor Limit", x1: domain.x[0], x2: domain.x[1], y1: domain.y[0], y2: floor, fill: "#fecaca", opacity: 0.45, labelColor: "#7f1d1d", labelPosition: "insideBottomLeft" },
      { label: "Growth Participation Zone", x1: 0, x2: cap, fill: "#bfdbfe", opacity: 0.35, labelColor: "#1e3a8a", labelPosition: "insideTopRight" },
      { label: "Capped Upside", y1: cap, y2: domain.y[1], fill: "#dbeafe", opacity: 0.45, labelColor: "#1d4ed8", labelPosition: "insideTopRight" },
      { label: "Exposed Loss Zone", x1: domain.x[0], x2: 0, y1: floor, y2: 0, fill: "#fee2e2", opacity: 0.3, labelColor: "#b91c1c", labelPosition: "insideBottomLeft" }
    ];
  }

  if (["precision", "dualPrecision", "protectionTrigger"].includes(strategyId)) {
    return [
      { label: "Losses Beyond Buffer", x1: domain.x[0], x2: -buffer, y1: domain.y[0], y2: 0, fill: "#fecaca", opacity: 0.48, labelColor: "#991b1b", labelPosition: "insideBottomLeft" },
      { label: strategyId === "dualPrecision" ? "Trigger Credit Zone (incl. mild down)" : "Trigger Credit Zone", x1: strategyId === "dualPrecision" ? -buffer : 0, x2: domain.x[1], y1: 0, y2: inputs.triggerRate ?? 0.06, fill: "#bbf7d0", opacity: 0.4, labelColor: "#166534", labelPosition: "insideTopRight" },
      { label: "Buffer Protected Zone", x1: -buffer, x2: 0, y1: -0.02, y2: 0.06, fill: "#a7f3d0", opacity: 0.32, labelColor: "#065f46", labelPosition: "insideBottomRight" },
      { label: "Growth Participation Zone", x1: 0, x2: domain.x[1], y1: 0, y2: domain.y[1], fill: "#dbeafe", opacity: 0.2, labelColor: "#1d4ed8", labelPosition: "insideTopLeft" }
    ];
  }

  if (["protectionCap"].includes(strategyId)) {
    return [
      { label: "Principal Protected Zone", x1: domain.x[0], x2: 0, y1: 0, y2: 0.05, fill: "#a7f3d0", opacity: 0.45, labelColor: "#166534", labelPosition: "insideTopLeft" },
      { label: "Growth Participation Zone", x1: 0, x2: inputs.cap ?? 0.08, y1: 0, y2: inputs.cap ?? 0.08, fill: "#bfdbfe", opacity: 0.3, labelColor: "#1e3a8a", labelPosition: "insideTopRight" },
      { label: "Capped Upside", y1: inputs.cap ?? 0.08, y2: domain.y[1], fill: "#dbeafe", opacity: 0.48, labelColor: "#1d4ed8", labelPosition: "insideTopRight" }
    ];
  }

  return [
    { label: "Losses Beyond Buffer", x1: domain.x[0], x2: -buffer, y1: domain.y[0], y2: 0, fill: "#fecaca", opacity: 0.5, labelColor: "#991b1b", labelPosition: "insideBottomLeft" },
    { label: "Buffer Protected Zone", x1: -buffer, x2: 0, y1: -0.02, y2: 0.06, fill: "#a7f3d0", opacity: 0.35, labelColor: "#065f46", labelPosition: "insideBottomRight" },
    { label: "Growth Participation Zone", x1: 0, x2: domain.x[1], y1: 0, y2: inputs.cap ?? domain.y[1], fill: "#bfdbfe", opacity: 0.25, labelColor: "#1e3a8a", labelPosition: "insideTopLeft" },
    { label: "Capped Upside", y1: cap, y2: domain.y[1], fill: "#dbeafe", opacity: 0.5, labelColor: "#1d4ed8", labelPosition: "insideTopRight" }
  ];
}

function getThresholdMarkers(strategyId: string, inputs: StrategyInputs): Marker[] {
  const markers: Marker[] = [
    { axis: "x", value: 0, label: "Zero Market", color: "#334155", dashed: true, position: "insideTopLeft" },
    { axis: "y", value: 0, label: "Zero Credit", color: "#334155", dashed: true, position: "right" }
  ];

  if (inputs.buffer) {
    markers.push({ axis: "x", value: -inputs.buffer, label: "Buffer Edge", color: "#0f766e", position: "insideTopLeft" });
  }
  if (inputs.cap) {
    markers.push({ axis: "y", value: inputs.cap, label: "Cap", color: "#1d4ed8", position: "right" });
  }
  if (inputs.floor) {
    markers.push({ axis: "y", value: inputs.floor, label: "Floor", color: "#b91c1c", position: "left" });
  }
  if (inputs.triggerRate && ["precision", "dualPrecision", "protectionTrigger"].includes(strategyId)) {
    markers.push({ axis: "y", value: inputs.triggerRate, label: "Trigger Credit", color: "#166534", position: "left" });
  }

  return markers;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
