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
  setMarketReturn,
  roundToDollar
}: {
  startingPremium: number;
  marketReturn: number;
  setMarketReturn: (value: number) => void;
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
    <section className="space-y-6">
      <header className="rounded-[24px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Compare Strategies</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Side-by-side strategy behavior</h2>
        <div className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_1fr_1.4fr]">
          <Assumption label="Market assumption" value={pct(marketReturn)} />
          <Assumption label="Starting premium" value={currency(startingPremium, roundToDollar)} />
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Synchronized market slider
            <input type="range" min={-0.4} max={0.4} step={0.005} value={marketReturn} onChange={(e) => setMarketReturn(Number(e.target.value))} className="mt-3 w-full accent-slate-700" />
            <div className="mt-1 flex justify-between text-[11px] font-normal text-slate-500"><span>-40%</span><span>0%</span><span>+40%</span></div>
          </label>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <StrategyPanel title="Strategy A" strategy={aStrategy} setStrategy={setAStrategy} inputs={aInputs} setInputs={setAInputs} result={comparison.a} roundToDollar={roundToDollar} marketReturn={marketReturn} />
        <StrategyPanel title="Strategy B" strategy={bStrategy} setStrategy={setBStrategy} inputs={bInputs} setInputs={setBInputs} result={comparison.b} roundToDollar={roundToDollar} marketReturn={marketReturn} />
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <Delta label="Credited return delta (B-A)" value={pct(comparison.creditedDifference)} />
          <Delta label="Ending value delta (B-A)" value={currency(comparison.endingValueDifference, roundToDollar)} />
          <Delta label="Downside behavior" value={strategyById[bStrategy].protectionType === strategyById[aStrategy].protectionType ? "Similar profile" : `${strategyById[bStrategy].protectionType} vs ${strategyById[aStrategy].protectionType}`} />
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
  const activeCredited = config.calculate(marketReturn, inputs);

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
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

      <MiniPayoff data={data} marketReturn={marketReturn} activeCredited={activeCredited} />

      <div className="mt-3 grid gap-2 text-sm">
        <Stat label="Credited return" value={pct(result.creditedReturn)} />
        <Stat label="Ending value" value={currency(result.endingValue, roundToDollar)} />
        <Stat label="Dollar change" value={currency(result.dollarChange, roundToDollar)} />
      </div>
      <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{result.explanation}</p>
    </article>
  );
}

function MiniPayoff({ data, marketReturn, activeCredited }: { data: Array<{ market: number; credited: number }>; marketReturn: number; activeCredited: number }) {
  const width = 320;
  const height = 132;
  const xMin = -0.5;
  const xMax = 0.5;
  const yMin = -0.5;
  const yMax = 0.5;
  const x = (value: number) => ((value - xMin) / (xMax - xMin)) * width;
  const y = (value: number) => height - ((value - yMin) / (yMax - yMin)) * height;
  const path = data.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.market)},${y(p.credited)}`).join(" ");

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full">
        <rect x={0} y={0} width={width} height={height} fill="#f8fafc" />
        <line x1={0} y1={y(0)} x2={width} y2={y(0)} stroke="#94a3b8" strokeDasharray="4 4" />
        <line x1={x(0)} y1={0} x2={x(0)} y2={height} stroke="#94a3b8" strokeDasharray="4 4" />
        <path d={path} stroke="#0f172a" strokeWidth={2.5} fill="none" />
        <circle cx={x(marketReturn)} cy={y(activeCredited)} r={4.5} fill="#0f172a" stroke="#fff" strokeWidth={2} />
      </svg>
      <p className="mt-2 text-xs text-slate-600">Active scenario: {pct(marketReturn)} market / {pct(activeCredited)} credited.</p>
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
