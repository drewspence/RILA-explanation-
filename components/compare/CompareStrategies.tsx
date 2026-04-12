"use client";

import { useMemo, useState } from "react";
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
      <div className="flex items-center rounded-xl border border-slate-200 px-3 py-2">
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

  const renderTerms = (side: "A" | "B", strategyId: StrategyId, inputs: StrategyInputs, setInputs: (inputs: StrategyInputs) => void) => {
    const keys = visibleInputKeys(strategyId);
    const update = (key: keyof StrategyInputs, pctValue: number) => {
      setInputs({ ...inputs, [key]: uiPercentToDecimal(pctValue) });
    };

    return (
      <div className="grid gap-2">
        {keys.includes("buffer") && (
          <TermField label="Buffer" value={(inputs.buffer ?? 0) * 100} min={0} max={40} onChange={(v) => update("buffer", v)} />
        )}
        {keys.includes("cap") && (
          <TermField label="Cap" value={(inputs.cap ?? 0) * 100} min={0} max={50} onChange={(v) => update("cap", v)} />
        )}
        {keys.includes("floor") && (
          <TermField label="Floor" value={(inputs.floor ?? 0) * 100} min={-40} max={0} onChange={(v) => update("floor", v)} />
        )}
        {keys.includes("triggerRate") && (
          <TermField label="Trigger" value={(inputs.triggerRate ?? 0) * 100} min={0} max={20} onChange={(v) => update("triggerRate", v)} />
        )}
        {keys.includes("participationRate") && (
          <TermField label="Participation" value={(inputs.participationRate ?? 0) * 100} min={0} max={200} onChange={(v) => update("participationRate", v)} />
        )}
        <p className="text-xs text-slate-500">Strategy {side} uses only relevant terms.</p>
      </div>
    );
  };

  return (
    <Card>
      <h3 className="text-xl font-semibold">Strategy Head-to-Head</h3>
      <p className="mt-1 text-sm text-slate-600">Same market return, two strategy designs, independent terms on each side.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Strategy A</p>
          <select className="mt-2 w-full rounded-xl border p-2" value={aStrategy} onChange={(e) => { const id = e.target.value as StrategyId; setAStrategy(id); setAInputs({ ...strategyById[id].defaults }); }}>
            {strategyConfigs.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <div className="mt-3">{renderTerms("A", aStrategy, aInputs, setAInputs)}</div>
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
            <p><strong>Credited return:</strong> {pct(comparison.a.creditedReturn)}</p>
            <p><strong>Dollar gain/loss:</strong> {currency(comparison.a.dollarChange, roundToDollar)}</p>
            <p><strong>Ending value:</strong> {currency(comparison.a.endingValue, roundToDollar)}</p>
            <p className="mt-2 text-slate-600">{comparison.a.explanation}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Strategy B</p>
          <select className="mt-2 w-full rounded-xl border p-2" value={bStrategy} onChange={(e) => { const id = e.target.value as StrategyId; setBStrategy(id); setBInputs({ ...strategyById[id].defaults }); }}>
            {strategyConfigs.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <div className="mt-3">{renderTerms("B", bStrategy, bInputs, setBInputs)}</div>
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
            <p><strong>Credited return:</strong> {pct(comparison.b.creditedReturn)}</p>
            <p><strong>Dollar gain/loss:</strong> {currency(comparison.b.dollarChange, roundToDollar)}</p>
            <p><strong>Ending value:</strong> {currency(comparison.b.endingValue, roundToDollar)}</p>
            <p className="mt-2 text-slate-600">{comparison.b.explanation}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h4 className="font-semibold text-slate-900">Comparison summary</h4>
        <p className="mt-1">Credited return difference (B - A): <strong>{pct(comparison.creditedDifference)}</strong></p>
        <p>Ending value difference (B - A): <strong>{currency(comparison.endingValueDifference, roundToDollar)}</strong></p>
        <p className="mt-2 text-slate-700">{comparison.summary}</p>
      </div>
    </Card>
  );
}
