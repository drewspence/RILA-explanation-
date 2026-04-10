"use client";

import {
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
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
}

export function PayoffChart({
  strategy,
  inputs,
  data,
  marketReturn,
  creditedReturn,
  startingPremium,
  endingValue
}: Props) {
  const chartMeta = buildPayoffChartMeta(strategy.id, inputs);
  const thresholds = [marketReturn, creditedReturn, inputs.buffer ? -inputs.buffer : 0, inputs.cap ?? 0, inputs.floor ?? 0, inputs.triggerRate ?? 0];
  const domain = buildChartDomain(data, thresholds);

  return (
    <div className="space-y-4">
      <div className="h-[380px] w-full rounded-2xl bg-slate-50 p-2">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 18, right: 20, bottom: 16, left: 6 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" />

            {chartMeta.zones.map((zone) => (
              <ReferenceArea
                key={`${zone.kind}-${zone.label}`}
                x1={zone.x1}
                x2={zone.x2}
                y1={zone.y1}
                y2={zone.y2}
                fill={zone.kind === "buffer" ? "#99f6e4" : zone.kind === "cap" ? "#bfdbfe" : "#fecaca"}
                fillOpacity={0.28}
                ifOverflow="extendDomain"
              >
                <Label value={zone.label} position="insideTop" fill="#334155" fontSize={12} />
              </ReferenceArea>
            ))}

            {chartMeta.lines.map((line) => (
              <ReferenceLine
                key={`${line.axis}-${line.value}-${line.kind}`}
                {...(line.axis === "x" ? { x: line.value } : { y: line.value })}
                stroke={line.kind === "neutral" ? "#64748b" : line.kind === "cap" ? "#2563eb" : line.kind === "floor" ? "#dc2626" : "#7c3aed"}
                strokeDasharray={line.kind === "neutral" ? "5 5" : "3 3"}
              >
                <Label value={line.label} fill="#334155" position={line.axis === "x" ? "top" : "right"} fontSize={12} />
              </ReferenceLine>
            ))}

            <ReferenceLine x={marketReturn} stroke="#0f172a" strokeDasharray="2 4" />
            <ReferenceLine y={creditedReturn} stroke="#0f172a" strokeDasharray="2 4" />

            <XAxis
              type="number"
              dataKey="market"
              domain={domain.x}
              tickFormatter={pct}
              label={{ value: "Hypothetical market / index return", dy: 14, fill: "#334155" }}
              tick={{ fill: "#475569", fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="credited"
              domain={domain.y}
              tickFormatter={pct}
              label={{ value: "Credited strategy return", angle: -90, dx: -6, fill: "#334155" }}
              tick={{ fill: "#475569", fontSize: 12 }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const market = Number(label ?? 0);
                const credited = Number(payload[0]?.value ?? 0);
                const projectedEndingValue = computeEndingValue(startingPremium, credited);

                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg">
                    <p><strong>Market return:</strong> {pct(market)}</p>
                    <p><strong>Credited return:</strong> {pct(credited)}</p>
                    <p><strong>Ending value:</strong> {currency(projectedEndingValue)}</p>
                    <p className="mt-1 text-slate-600">{strategy.explainer(market, inputs, credited)}</p>
                  </div>
                );
              }}
            />

            <Legend
              verticalAlign="top"
              align="left"
              iconType="plainline"
              formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
            />

            <Line
              type="monotone"
              dataKey="credited"
              stroke="#1d4ed8"
              strokeWidth={3}
              dot={false}
              name="Strategy payoff line"
              isAnimationActive={false}
            />
            <Scatter
              data={[{ market: marketReturn, credited: creditedReturn }]}
              fill="#0f172a"
              line={{ stroke: "#0f172a", strokeDasharray: "2 4" }}
              name="Current assumption"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-900">What this chart shows</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>The blue line maps market return (x-axis) to credited return (y-axis).</li>
          <li>The highlighted point is your current assumption: {pct(marketReturn)} market and {pct(creditedReturn)} credited.</li>
          <li>Estimated ending value at this point: {currency(endingValue)} on {currency(startingPremium)} starting premium.</li>
          {chartMeta.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
