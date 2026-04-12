"use client";

import { ReactNode, useMemo, useState } from "react";
import { Card } from "@/components/shared/Card";
import { compareStrategyOutcomes, visibleInputKeys } from "@/lib/calculations/engine";
import { currency, pct, uiPercentToDecimal } from "@/lib/formatters";
import { strategyById, strategyConfigs } from "@/lib/strategyConfigs";
import { StrategyId, StrategyInputs } from "@/types/strategy";

function TermField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.5
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent text-sm focus:outline-none"
        />
        <span className="text-slate-500">%</span>
      </div>
    </label>
  );
}

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

  const renderTerms = (strategyId: StrategyId, inputs: StrategyInputs, setInputs: (inputs: StrategyInputs) => void) => {
    const keys = visibleInputKeys(strategyId);
    const update = (key: keyof StrategyInputs, pctValue: number) => {
      setInputs({ ...inputs, [key]: uiPercentToDecimal(pctValue) });
    };

    return (
      <div className="grid gap-2">
        {keys.includes("buffer") && <TermField label="Buffer" value={(inputs.buffer ?? 0) * 100} min={0} max={40} onChange={(v) => update("buffer", v)} />}
        {keys.includes("cap") && <TermField label="Cap" value={(inputs.cap ?? 0) * 100} min={0} max={50} onChange={(v) => update("cap", v)} />}
        {keys.includes("floor") && <TermField label="Floor" value={(inputs.floor ?? 0) * 100} min={-40} max={0} onChange={(v) => update("floor", v)} />}
        {keys.includes("triggerRate") && <TermField label="Trigger" value={(inputs.triggerRate ?? 0) * 100} min={0} max={20} onChange={(v) => update("triggerRate", v)} />}
        {keys.includes("participationRate") && <TermField label="Participation" value={(inputs.participationRate ?? 0) * 100} min={0} max={200} onChange={(v) => update("participationRate", v)} />}
      </div>
    );
  };

  return (
    <Card>
      <h3 className="text-2xl font-semibold text-slate-900">Premium Strategy Comparison</h3>
      <p className="mt-1 text-sm text-slate-600">Same market scenario, two strategy structures. Quickly see who protects more and who grows more.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ComparePanel side="A" strategy={aStrategy} setStrategy={(id) => { setAStrategy(id); setAInputs({ ...strategyById[id].defaults }); }} details={comparison.a} roundToDollar={roundToDollar}>
          {renderTerms(aStrategy, aInputs, setAInputs)}
        </ComparePanel>

        <ComparePanel side="B" strategy={bStrategy} setStrategy={(id) => { setBStrategy(id); setBInputs({ ...strategyById[id].defaults }); }} details={comparison.b} roundToDollar={roundToDollar}>
          {renderTerms(bStrategy, bInputs, setBInputs)}
        </ComparePanel>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
        <Delta label="Credited return delta (B - A)" value={pct(comparison.creditedDifference)} />
        <Delta label="Ending value delta (B - A)" value={currency(comparison.endingValueDifference, roundToDollar)} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Best for this scenario</p>
          <p className="mt-1 text-sm text-slate-800">{comparison.summary}</p>
        </div>
      </div>
    </Card>
  );
}

function ComparePanel({
  side,
  strategy,
  setStrategy,
  children,
  details,
  roundToDollar
}: {
  side: "A" | "B";
  strategy: StrategyId;
  setStrategy: (id: StrategyId) => void;
  children: ReactNode;
  details: { creditedReturn: number; dollarChange: number; endingValue: number; explanation: string };
  roundToDollar: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Strategy {side}</p>
      <select
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-2"
        value={strategy}
        onChange={(e) => setStrategy(e.target.value as StrategyId)}
      >
        {strategyConfigs.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <div className="mt-3">{children}</div>
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
        <p><strong>Credited return:</strong> {pct(details.creditedReturn)}</p>
        <p><strong>Dollar gain/loss:</strong> {currency(details.dollarChange, roundToDollar)}</p>
        <p><strong>Ending value:</strong> {currency(details.endingValue, roundToDollar)}</p>
        <p className="mt-2 text-slate-600">{details.explanation}</p>
      </div>
    </div>
  );
}

function Delta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
