"use client";

import { useMemo, useState } from "react";
import { compareStrategyOutcomes, visibleInputKeys } from "@/lib/calculations/engine";
import { buildPayoffData } from "@/lib/calculations/engine";
import { currency, pct, uiPercentToDecimal } from "@/lib/formatters";
import { strategyById, strategyConfigs } from "@/lib/strategyConfigs";
import { StrategyId, StrategyInputs } from "@/types/strategy";

const defaults = {
  a: { strategyId: "performanceCap" as StrategyId, inputs: { ...strategyById.performanceCap.defaults } },
  b: { strategyId: "dualPrecision" as StrategyId, inputs: { ...strategyById.dualPrecision.defaults } }
};

export function CompareStrategies({
  startingPremium,
  marketReturn,
  roundToDollar
}: {
  startingPremium: number;
  marketReturn: number;
  roundToDollar: boolean;
}) {
  const [aStrategy, setAStrategy] = useState<StrategyId>(defaults.a.strategyId);
  const [bStrategy, setBStrategy] = useState<StrategyId>(defaults.b.strategyId);
  const [aInputs, setAInputs] = useState<StrategyInputs>(defaults.a.inputs);
  const [bInputs, setBInputs] = useState<StrategyInputs>(defaults.b.inputs);

  const aConfig = strategyById[aStrategy];
  const bConfig = strategyById[bStrategy];

  const comparison = useMemo(
    () =>
      compareStrategyOutcomes({
        strategyA: aConfig,
        strategyB: bConfig,
        inputsA: aInputs,
        inputsB: bInputs,
        marketReturn,
        startingPremium
      }),
    [aConfig, bConfig, aInputs, bInputs, marketReturn, startingPremium]
  );

  return (
    <section className="space-y-5">
      <header className="rounded-[24px] border border-slate-200 bg-white px-6 py-5 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Compare Lab</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Side-by-side strategy behavior</h2>
        <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
          <Assumption label="Synchronized market assumption" value={pct(marketReturn)} />
          <Assumption label="Starting premium" value={currency(startingPremium, roundToDollar)} />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <StrategyPanel title="Strategy A" strategy={aStrategy} setStrategy={setAStrategy} inputs={aInputs} setInputs={setAInputs} result={comparison.a} roundToDollar={roundToDollar} marketReturn={marketReturn} />
        <StrategyPanel title="Strategy B" strategy={bStrategy} setStrategy={setBStrategy} inputs={bInputs} setInputs={setBInputs} result={comparison.b} roundToDollar={roundToDollar} marketReturn={marketReturn} />
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-lg">
        <div className="grid gap-3 md:grid-cols-3">
          <Delta label="Credited return delta (B-A)" value={pct(comparison.creditedDifference)} />
          <Delta label="Ending value delta (B-A)" value={currency(comparison.endingValueDifference, roundToDollar)} />
          <Delta label="Downside behavior" value={strategyById[bStrategy].protectionType === strategyById[aStrategy].protectionType ? "Similar profile" : `${strategyById[bStrategy].protectionType} vs ${strategyById[aStrategy].protectionType}`} />
        </div>
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Best for this scenario</p>
          <p className="mt-1 text-sm text-emerald-900">{comparison.summary}</p>
        </div>
      </div>
    </section>
  );
}

function StrategyPanel({
  title,
  strategy,
  setStrategy,
  inputs,
  setInputs,
  result,
  roundToDollar,
  marketReturn
}: {
  title: string;
  strategy: StrategyId;
  setStrategy: (id: StrategyId) => void;
  inputs: StrategyInputs;
  setInputs: (inputs: StrategyInputs) => void;
  result: { creditedReturn: number; dollarChange: number; endingValue: number; explanation: string };
  roundToDollar: boolean;
  marketReturn: number;
}) {
  const keys = visibleInputKeys(strategy);
  const config = strategyById[strategy];
  const data = buildPayoffData(config, inputs);

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm" value={strategy} onChange={(e) => { const id = e.target.value as StrategyId; setStrategy(id); setInputs({ ...strategyById[id].defaults }); }}>
        {strategyConfigs.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {keys.includes("buffer") && <Term label="Buffer" value={(inputs.buffer ?? 0) * 100} onChange={(v) => setInputs({ ...inputs, buffer: uiPercentToDecimal(v) })} min={0} max={40} />}
        {keys.includes("cap") && <Term label="Cap" value={(inputs.cap ?? 0) * 100} onChange={(v) => setInputs({ ...inputs, cap: uiPercentToDecimal(v) })} min={0} max={50} />}
        {keys.includes("floor") && <Term label="Floor" value={(inputs.floor ?? 0) * 100} onChange={(v) => setInputs({ ...inputs, floor: uiPercentToDecimal(v) })} min={-40} max={0} />}
        {keys.includes("triggerRate") && <Term label="Trigger" value={(inputs.triggerRate ?? 0) * 100} onChange={(v) => setInputs({ ...inputs, triggerRate: uiPercentToDecimal(v) })} min={0} max={20} />}
        {keys.includes("participationRate") && <Term label="Participation" value={(inputs.participationRate ?? 0) * 100} onChange={(v) => setInputs({ ...inputs, participationRate: uiPercentToDecimal(v) })} min={0} max={200} />}
      </div>

      <MiniPayoff data={data} marketReturn={marketReturn} />

      <div className="mt-3 grid gap-2 text-sm">
        <Stat label="Credited return" value={pct(result.creditedReturn)} />
        <Stat label="Ending value" value={currency(result.endingValue, roundToDollar)} />
        <Stat label="Dollar change" value={currency(result.dollarChange, roundToDollar)} />
      </div>
      <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{result.explanation}</p>
    </article>
  );
}

function MiniPayoff({ data, marketReturn }: { data: Array<{ market: number; credited: number }>; marketReturn: number }) {
  const points = data.filter((p) => p.market % 0.05 === 0 || Math.abs(p.market - marketReturn) < 0.005);
  const width = 320;
  const height = 120;
  const x = (value: number) => ((value + 0.5) / 1.0) * width;
  const y = (value: number) => height - ((value + 0.5) / 1.0) * height;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.market)},${y(p.credited)}`).join(" ");
  const active = data.reduce((closest, p) => Math.abs(p.market - marketReturn) < Math.abs(closest.market - marketReturn) ? p : closest, data[0]);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-950/95 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full">
        <rect x={0} y={0} width={width} height={height} fill="#020617" />
        <line x1={0} y1={y(0)} x2={width} y2={y(0)} stroke="#334155" strokeDasharray="4 4" />
        <line x1={x(0)} y1={0} x2={x(0)} y2={height} stroke="#334155" strokeDasharray="4 4" />
        <path d={path} stroke="#60a5fa" strokeWidth={3} fill="none" />
        <circle cx={x(active.market)} cy={y(active.credited)} r={4} fill="#f8fafc" stroke="#60a5fa" strokeWidth={2} />
      </svg>
      <p className="mt-2 text-xs text-slate-300">Mini payoff diagram at {pct(marketReturn)} market assumption.</p>
    </div>
  );
}

function Term({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number; }) {
  return (
    <label className="text-xs text-slate-600">
      <span className="font-semibold uppercase tracking-wide">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-slate-300 px-2 py-1">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} className="w-full bg-transparent text-sm outline-none" />
        <span className="text-xs text-slate-500">%</span>
      </div>
    </label>
  );
}

function Assumption({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-1.5 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function Delta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
