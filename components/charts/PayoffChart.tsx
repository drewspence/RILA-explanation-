"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Scatter,
  ComposedChart
} from "recharts";
import { pct } from "@/lib/formatters";

interface Props {
  data: Array<{ market: number; credited: number }>;
  marketReturn: number;
  creditedReturn: number;
}

export function PayoffChart({ data, marketReturn, creditedReturn }: Props) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <ReferenceArea x1={0} x2={0.4} y1={0} y2={0.4} fill="#dbeafe" fillOpacity={0.45} />
          <ReferenceArea x1={-0.1} x2={0} y1={0} y2={0.1} fill="#dcfce7" fillOpacity={0.5} />
          <ReferenceArea x1={-0.4} x2={-0.1} y1={-0.4} y2={0.05} fill="#fee2e2" fillOpacity={0.3} />
          <XAxis dataKey="market" tickFormatter={pct} label={{ value: "Market Return", dy: 14 }} />
          <YAxis tickFormatter={pct} label={{ value: "Credited Return", angle: -90, dx: -14 }} />
          <Tooltip formatter={(value: number) => pct(value)} labelFormatter={(value) => `Market: ${pct(Number(value))}`} />
          <Line type="monotone" dataKey="credited" stroke="#1d4ed8" strokeWidth={3} dot={false} />
          <Scatter data={[{ market: marketReturn, credited: creditedReturn }]} fill="#b91c1c" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
