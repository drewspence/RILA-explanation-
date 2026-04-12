"use client";

import {
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
import { buildChartDomain, buildPayoffChartMeta } from "@/lib/calculations/payoffVisualization";
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

const zoneStyles = {
  buffer: { fill: "#99f6e4", label: "text-emerald-700", pill: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  loss: { fill: "#fecaca", label: "text-rose-700", pill: "bg-rose-50 border-rose-200 text-rose-700" },
  cap: { fill: "#bfdbfe", label: "text-blue-700", pill: "bg-blue-50 border-blue-200 text-blue-700" },
  growth: { fill: "#c7d2fe", label: "text-indigo-700", pill: "bg-indigo-50 border-indigo-200 text-indigo-700" }
} as const;

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
  const chartMeta = buildPayoffChartMeta(strategy.id, inputs);
  const thresholds = [marketReturn, creditedReturn, inputs.buffer ? -inputs.buffer : 0, inputs.cap ?? 0, inputs.floor ?? 0, inputs.triggerRate ?? 0];
  const domain = buildChartDomain(data, thresholds);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {chartMeta.zones.map((zone) => {
          const style = zoneStyles[zone.kind as keyof typeof zoneStyles] || zoneStyles.growth;
          return (
            <div key={`${zone.kind}-${zone.label}`} className={`rounded-xl border px-3 py-2 text-xs font-medium ${style.pill}`}>
              {zone.label}
            </div>
          );
        })}
      </div>

      <div className="h-[420px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 26, right: 52, bottom: 22, left: 18 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" />

            {chartMeta.zones.map((zone) => {
              const style = zoneStyles[zone.kind as keyof typeof zoneStyles] || zoneStyles.growth;
              return (
                <ReferenceArea
                  key={`${zone.kind}-${zone.label}`}
                  x1={zone.x1}
                  x2={zone.x2}
                  y1={zone.y1}
                  y2={zone.y2}
                  fill={style.fill}
                  fillOpacity={0.28}
                  ifOverflow="extendDomain"
                >
                  <Label value={zone.label} position={zone.labelPosition ?? "insideTopLeft"} fill="#1e293b" fontSize={11} />
                </ReferenceArea>
              );
            })}

            {chartMeta.lines.map((line) => (
              <ReferenceLine
                key={`${line.axis}-${line.value}-${line.kind}`}
                {...(line.axis === "x" ? { x: line.value } : { y: line.value })}
                stroke={line.kind === "neutral" ? "#64748b" : line.kind === "cap" ? "#2563eb" : line.kind === "floor" ? "#dc2626" : "#7c3aed"}
                strokeDasharray={line.kind === "neutral" ? "5 5" : "3 3"}
              >
                <Label value={line.label} fill="#334155" position={line.labelPosition ?? (line.axis === "x" ? "insideTopLeft" : "right")} fontSize={11} />
              </ReferenceLine>
            ))}

            <ReferenceLine x={marketReturn} stroke="#0f172a" strokeDasharray="2 4" />
            <ReferenceLine y={creditedReturn} stroke="#0f172a" strokeDasharray="2 4" />

            <XAxis
              type="number"
              dataKey="market"
              domain={domain.x}
              tickFormatter={pct}
              label={{ value: "Index return", dy: 14, fill: "#334155" }}
              tick={{ fill: "#475569", fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="credited"
              domain={domain.y}
              tickFormatter={pct}
              label={{ value: "Credited return", angle: -90, dx: -2, fill: "#334155" }}
              tick={{ fill: "#475569", fontSize: 12 }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const market = Number(label ?? 0);
                const credited = Number(payload[0]?.value ?? 0);
                const projectedEndingValue = computeEndingValue(startingPremium, credited);

                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
                    <p><strong>Index move:</strong> {pct(market)}</p>
                    <p><strong>Credited:</strong> {pct(credited)}</p>
                    <p><strong>Projected ending value:</strong> {currency(projectedEndingValue)}</p>
                  </div>
                );
              }}
            />

            <Line type="monotone" dataKey="credited" stroke="#0f172a" strokeWidth={3} dot={false} isAnimationActive={false} />

            <ReferenceDot x={marketReturn} y={creditedReturn} r={6} fill="#0f172a" stroke="#fff" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">Current Scenario</h4>
          <p className="mt-2 text-sm text-slate-700">{pct(marketReturn)} market return maps to <strong>{pct(creditedReturn)}</strong> credited return.</p>
          <p className="mt-1 text-sm text-slate-700">Estimated ending value: <strong>{currency(endingValue)}</strong> on {currency(startingPremium)}.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">What this teaches</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Shaded regions show where losses are absorbed vs. exposed.</li>
            <li>Threshold lines call out key contract terms like cap, floor, or trigger.</li>
            <li>{scenarioExplanation}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
