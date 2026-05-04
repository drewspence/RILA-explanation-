"use client";

import { useMemo, useState } from "react";
import { BarChart3, FileText, GitCompareArrows } from "lucide-react";
import { Field } from "@/components/shared/Field";
import { strategyById, strategyConfigs } from "@/lib/strategyConfigs";
import { StrategyId, StrategyInputs, StrategyResult } from "@/types/strategy";
import { calculateStrategyOutcome, buildPayoffData, visibleInputKeys } from "@/lib/calculations/engine";
import { decimalToUiPercent, pct, uiPercentToDecimal, currency } from "@/lib/formatters";
import { PayoffChart } from "@/components/charts/PayoffChart";
import { scenarioPresets } from "@/lib/scenarioPresets";
import { CompareStrategies } from "@/components/compare/CompareStrategies";
import { PresentationView } from "@/components/print/PresentationView";

const tabs = [
  { id: "scenario", label: "Scenario Builder", icon: BarChart3 },
  { id: "compare", label: "Compare Strategies", icon: GitCompareArrows },
  { id: "print", label: "Presentation View", icon: FileText }
] as const;

export default function HomePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("scenario");
  const [strategyId, setStrategyId] = useState<StrategyId>("performanceCap");
  const [startingPremium, setStartingPremium] = useState(100000);
  const [marketReturn, setMarketReturn] = useState(0.08);
  const [roundToDollar, setRoundToDollar] = useState(false);
  const [clientName, setClientName] = useState("");

  const [strategyInputsMap, setStrategyInputsMap] = useState<Record<string, StrategyInputs>>(
    Object.fromEntries(strategyConfigs.map((s) => [s.id, s.defaults]))
  );

  const strategy = strategyById[strategyId];
  const inputs = strategyInputsMap[strategyId] || strategy.defaults;

  const outcome = useMemo(
    () => calculateStrategyOutcome(strategy, marketReturn, startingPremium, inputs),
    [strategy, marketReturn, startingPremium, inputs]
  );

  const payoffData = useMemo(() => buildPayoffData(strategy, inputs), [strategy, inputs]);

  const setDecimalInput = (key: keyof StrategyInputs, value: number) => {
    setStrategyInputsMap((prev) => ({
      ...prev,
      [strategyId]: { ...prev[strategyId], [key]: value }
    }));
  };

  const setLabelInput = (value: string) => {
    setStrategyInputsMap((prev) => ({
      ...prev,
      [strategyId]: { ...prev[strategyId], labelOverride: value }
    }));
  };

  const activeKeys = visibleInputKeys(strategyId);

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-12 pt-5 lg:px-8" data-testid="app-root">
      <header className="no-print mb-6 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">RILA explanation tool</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Structured Outcome Studio</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 lg:text-base">A client-facing visual walkthrough for how different RILA payoff designs behave under one market scenario.</p>
          </div>
        </div>
        <nav className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                data-testid={`tab-${t.id}`}
                className={`inline-flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                  tab === t.id
                    ? "border-slate-900 bg-slate-900 text-white shadow"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                <span className="font-medium">{t.label}</span>
                <Icon size={16} />
              </button>
            );
          })}
        </nav>
      </header>

      {tab === "scenario" && (
        <ScenarioBuilder
          strategyId={strategyId}
          setStrategyId={setStrategyId}
          startingPremium={startingPremium}
          setStartingPremium={setStartingPremium}
          marketReturn={marketReturn}
          setMarketReturn={setMarketReturn}
          roundToDollar={roundToDollar}
          setRoundToDollar={setRoundToDollar}
          strategy={strategy}
          strategyInputs={inputs}
          activeKeys={activeKeys}
          setDecimalInput={setDecimalInput}
          setLabelInput={setLabelInput}
          outcome={outcome}
          payoffData={payoffData}
        />
      )}

      {tab === "compare" && (
        <CompareStrategies startingPremium={startingPremium} marketReturn={marketReturn} setMarketReturn={setMarketReturn} roundToDollar={roundToDollar} />
      )}

      {tab === "print" && (
        <PresentationView
          strategy={inputs.labelOverride || strategy.label}
          strategyId={strategy.id}
          clientName={clientName}
          setClientName={setClientName}
          marketReturn={marketReturn}
          result={outcome}
          assumptions={activeKeys.map((key) => `${key}: ${pct((inputs[key] as number) ?? 0)}`)}
          payoffData={payoffData}
          inputs={inputs}
        />
      )}
    </main>
  );
}

function ScenarioBuilder({
  strategyId,
  setStrategyId,
  strategy,
  strategyInputs,
  activeKeys,
  setDecimalInput,
  setLabelInput,
  startingPremium,
  setStartingPremium,
  marketReturn,
  setMarketReturn,
  roundToDollar,
  setRoundToDollar,
  outcome,
  payoffData
}: {
  strategyId: StrategyId;
  setStrategyId: (id: StrategyId) => void;
  strategy: (typeof strategyConfigs)[number];
  strategyInputs: StrategyInputs;
  activeKeys: Array<keyof StrategyInputs>;
  setDecimalInput: (key: keyof StrategyInputs, value: number) => void;
  setLabelInput: (value: string) => void;
  startingPremium: number;
  setStartingPremium: (v: number) => void;
  marketReturn: number;
  setMarketReturn: (v: number) => void;
  roundToDollar: boolean;
  setRoundToDollar: (v: boolean) => void;
  outcome: StrategyResult;
  payoffData: Array<{ market: number; credited: number }>;
}) {
  return (
    <section data-testid="scenario-builder">
      <header className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Scenario Builder</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Choose assumptions and show how the strategy credits returns</h2>
      </header>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="no-print space-y-4 xl:sticky xl:top-4 xl:h-fit">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inputs</p>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">Strategy</label>
            <select data-testid="strategy-select" value={strategyId} onChange={(e) => setStrategyId(e.target.value as StrategyId)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
              {strategyConfigs.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <div data-testid="premium-input-wrap">
              <Field label="Premium" value={startingPremium} onChange={setStartingPremium} min={0} step={1000} suffix="" />
            </div>
            <label className="text-sm font-medium">Market scenario ({pct(marketReturn)})</label>
            <input data-testid="market-slider" type="range" min={-0.4} max={0.4} step={0.005} value={marketReturn} onChange={(e) => setMarketReturn(Number(e.target.value))} className="mt-2 w-full accent-slate-700" />
            <div className="mt-2 flex justify-between text-[11px] text-slate-500"><span>-40%</span><span>0%</span><span>+40%</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2" data-testid="scenario-presets">
              {scenarioPresets.map((p) => (
                <button key={p.label} onClick={() => setMarketReturn(p.value)} className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs hover:bg-slate-100">{p.label}</button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Strategy terms</p>
            <input type="text" value={strategyInputs.labelOverride || ""} onChange={(e) => setLabelInput(e.target.value)} placeholder="Optional strategy label" className="mb-3 mt-3 w-full rounded-xl border border-slate-300 p-2 text-sm" />
            {activeKeys.includes("buffer") && <Field label="Buffer" value={decimalToUiPercent(strategyInputs.buffer ?? 0.1)} onChange={(v) => setDecimalInput("buffer", uiPercentToDecimal(Math.min(40, Math.max(0, v))))} min={0} max={40} step={0.5} />}
            {activeKeys.includes("floor") && <Field label="Floor" value={decimalToUiPercent(strategyInputs.floor ?? -0.1)} onChange={(v) => setDecimalInput("floor", uiPercentToDecimal(Math.min(0, Math.max(-40, v))))} min={-40} max={0} step={0.5} />}
            {activeKeys.includes("cap") && <Field label="Cap" value={decimalToUiPercent(strategyInputs.cap ?? 0.12)} onChange={(v) => setDecimalInput("cap", uiPercentToDecimal(Math.min(50, Math.max(0, v))))} min={0} max={50} step={0.5} />}
            {activeKeys.includes("triggerRate") && <Field label="Trigger" value={decimalToUiPercent(strategyInputs.triggerRate ?? 0.09)} onChange={(v) => setDecimalInput("triggerRate", uiPercentToDecimal(Math.min(20, Math.max(0, v))))} min={0} max={20} step={0.5} />}
            {activeKeys.includes("participationRate") && <Field label="Participation" value={decimalToUiPercent(strategyInputs.participationRate ?? 1)} onChange={(v) => setDecimalInput("participationRate", uiPercentToDecimal(Math.min(200, Math.max(0, v))))} min={0} max={200} step={5} />}
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={roundToDollar} onChange={(e) => setRoundToDollar(e.target.checked)} /> Round to nearest dollar</label>
          </div>
        </aside>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
          <PayoffChart strategy={strategy} inputs={strategyInputs} data={payoffData} marketReturn={marketReturn} creditedReturn={outcome.creditedReturn} startingPremium={startingPremium} endingValue={outcome.endingValue} scenarioExplanation={outcome.explanation} />
        </section>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:h-fit">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live scenario</p>
            <p className="mt-3 text-sm text-slate-600">{pct(marketReturn)} market</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900" data-testid="live-credited-return">{pct(outcome.creditedReturn)}</p>
            <p className="mt-1 text-sm text-slate-600">Credited return</p>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500">Ending value</p>
              <p className="text-2xl font-semibold text-slate-950" data-testid="live-ending-value">{currency(outcome.endingValue, roundToDollar)}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What this means</p>
            <p className="mt-3 text-sm text-slate-700">{outcome.explanation}</p>
            <p className="mt-3 text-sm text-slate-700">{strategy.tradeoff}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
