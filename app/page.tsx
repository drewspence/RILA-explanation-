"use client";

import { useMemo, useState } from "react";
import { HeroOutcomeCard } from "@/components/strategy/HeroOutcomeCard";
import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Field } from "@/components/shared/Field";
import { strategyById, strategyConfigs } from "@/lib/strategyConfigs";
import { StrategyId, StrategyInputs } from "@/types/strategy";
import { calculateStrategyOutcome, buildPayoffData } from "@/lib/calculations/engine";
import { pct } from "@/lib/formatters";
import { PayoffChart } from "@/components/charts/PayoffChart";
import { scenarioPresets } from "@/lib/scenarioPresets";
import { ExplainerPanel } from "@/components/strategy/ExplainerPanel";
import { CompareStrategies } from "@/components/compare/CompareStrategies";
import { StrategyEducationCards } from "@/components/strategy/StrategyEducationCards";
import { AdvisorDetailsDrawer } from "@/components/strategy/AdvisorDetailsDrawer";
import { PresentationView } from "@/components/print/PresentationView";

const tabs = [
  "Strategy Overview",
  "Interactive Scenario Builder",
  "Compare Strategies",
  "How the Buffer/Floor Works",
  "Print / Presentation View"
] as const;

export default function HomePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const [strategyId, setStrategyId] = useState<StrategyId>("performanceCap");
  const [startingPremium, setStartingPremium] = useState(100000);
  const [marketReturn, setMarketReturn] = useState(0.08);
  const [feeEnabled, setFeeEnabled] = useState(false);
  const [annualFee, setAnnualFee] = useState(0.01);
  const [showNetOfFee, setShowNetOfFee] = useState(true);
  const [roundToDollar, setRoundToDollar] = useState(false);
  const [clientName, setClientName] = useState("");

  const [strategyInputsMap, setStrategyInputsMap] = useState<Record<string, StrategyInputs>>(
    Object.fromEntries(strategyConfigs.map((s) => [s.id, s.defaults]))
  );

  const strategy = strategyById[strategyId];
  const inputs = strategyInputsMap[strategyId] || strategy.defaults;

  const outcome = useMemo(
    () =>
      calculateStrategyOutcome(
        strategy,
        marketReturn,
        startingPremium,
        feeEnabled,
        annualFee,
        inputs,
        showNetOfFee
      ),
    [strategy, marketReturn, startingPremium, feeEnabled, annualFee, inputs, showNetOfFee]
  );

  const payoffData = useMemo(
    () => buildPayoffData(strategy, inputs, feeEnabled && showNetOfFee, annualFee),
    [strategy, inputs, feeEnabled, annualFee, showNetOfFee]
  );

  const setInput = (key: keyof StrategyInputs, value: number | string) => {
    setStrategyInputsMap((prev) => ({
      ...prev,
      [strategyId]: { ...prev[strategyId], [key]: typeof value === "number" ? Math.max(-1, Math.min(2, value)) : value }
    }));
  };

  return (
    <main className="mx-auto max-w-[1400px] p-4 lg:p-8">
      <div className="sticky top-2 z-20 mb-4 rounded-2xl bg-slate-900 p-4 text-white shadow-premium">
        <div className="flex flex-wrap items-center gap-4 text-sm lg:text-base">
          <strong>{inputs.labelOverride || strategy.label}</strong>
          <span>Market: {pct(marketReturn)}</span>
          <span>Credited: {pct(outcome.creditedReturnNet)}</span>
          <span>Ending: ${outcome.endingValue.toLocaleString(undefined, { maximumFractionDigits: roundToDollar ? 0 : 2 })}</span>
          <span>Protection: {strategy.protectionType}</span>
        </div>
      </div>

      <nav className="no-print mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm ${tab === t ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="no-print space-y-4">
          <Card>
            <SectionHeader title="Assumptions" subtitle="Editable advisor inputs" />
            <label className="mb-3 block text-sm font-medium">Strategy</label>
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value as StrategyId)}
              className="mb-4 w-full rounded-xl border border-slate-300 p-2"
            >
              {strategyConfigs.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <Field label="Starting premium" value={startingPremium} onChange={setStartingPremium} min={0} step={1000} />
            <div className="mt-4">
              <label className="text-sm font-medium">Market Return ({pct(marketReturn)})</label>
              <input
                type="range"
                min={-0.4}
                max={0.4}
                step={0.005}
                value={marketReturn}
                onChange={(e) => setMarketReturn(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {scenarioPresets.map((p) => (
                <button key={p.label} onClick={() => setMarketReturn(p.value)} className="rounded-lg border p-2 text-xs hover:bg-slate-50">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={feeEnabled} onChange={(e) => setFeeEnabled(e.target.checked)} /> Fee enabled</label>
              {feeEnabled && <Field label="Annual fee" value={annualFee} onChange={setAnnualFee} min={0} max={0.1} step={0.001} suffix="(decimal)" />}
              <label className="flex items-center gap-2"><input type="checkbox" checked={showNetOfFee} onChange={(e) => setShowNetOfFee(e.target.checked)} /> Show net of fee</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={roundToDollar} onChange={(e) => setRoundToDollar(e.target.checked)} /> Round to nearest dollar</label>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Strategy Terms" subtitle="Customize live in meeting" />
            <input
              type="text"
              value={inputs.labelOverride || ""}
              onChange={(e) => setInput("labelOverride", e.target.value)}
              placeholder="Optional custom strategy label"
              className="mb-3 w-full rounded-xl border border-slate-300 p-2"
            />
            <Field label="Buffer" value={inputs.buffer ?? 0.1} onChange={(v) => setInput("buffer", v)} min={0} max={0.4} step={0.005} suffix="decimal" />
            <Field label="Floor" value={inputs.floor ?? -0.1} onChange={(v) => setInput("floor", v)} min={-0.4} max={0} step={0.005} suffix="decimal" />
            <Field label="Cap" value={inputs.cap ?? 0.12} onChange={(v) => setInput("cap", v)} min={0} max={0.5} step={0.005} suffix="decimal" />
            <Field label="Trigger rate" value={inputs.triggerRate ?? 0.09} onChange={(v) => setInput("triggerRate", v)} min={0} max={0.5} step={0.005} suffix="decimal" />
            <Field label="Participation rate" value={inputs.participationRate ?? 1} onChange={(v) => setInput("participationRate", v)} min={0} max={2} step={0.01} suffix="decimal" />
          </Card>
        </aside>

        <section className="space-y-6">
          <HeroOutcomeCard
            strategyName={inputs.labelOverride || strategy.label}
            marketReturn={marketReturn}
            creditedReturn={outcome.creditedReturnNet}
            endingValue={outcome.endingValue}
            dollarChange={outcome.dollarChange}
            explanation={outcome.explanation}
            roundToDollar={roundToDollar}
          />

          {(tab === "Strategy Overview" || tab === "Interactive Scenario Builder") && (
            <Card>
              <SectionHeader
                title="Interactive Payoff Visualization"
                subtitle="See how market performance maps to credited strategy return in real time"
              />
              <PayoffChart
                strategy={strategy}
                inputs={inputs}
                data={payoffData}
                marketReturn={marketReturn}
                creditedReturn={outcome.creditedReturnNet}
                startingPremium={startingPremium}
                endingValue={outcome.endingValue}
              />
            </Card>
          )}

          {(tab === "How the Buffer/Floor Works" || tab === "Strategy Overview") && (
            <ExplainerPanel strategy={strategy} marketReturn={marketReturn} creditedReturn={outcome.creditedReturnNet} inputs={inputs} />
          )}

          {tab === "Compare Strategies" && (
            <CompareStrategies
              globalInputs={{ startingPremium, marketReturn, feeEnabled, annualFee, showNetOfFee, roundToDollar }}
              inputMap={strategyInputsMap}
            />
          )}

          {tab === "Strategy Overview" && <StrategyEducationCards />}

          <AdvisorDetailsDrawer strategy={strategy} inputs={inputs} feeEnabled={feeEnabled} annualFee={annualFee} showNetOfFee={showNetOfFee} />

          {tab === "Print / Presentation View" && (
            <>
              <Card className="no-print">
                <label className="text-sm font-medium">Client name</label>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-2 w-full rounded-xl border p-2" />
              </Card>
              <PresentationView strategy={inputs.labelOverride || strategy.label} clientName={clientName} />
            </>
          )}

          <footer className="rounded-2xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-200">
            This tool is a simplified educational illustration for one-year indexed strategy concepts. It is not an official carrier illustration. Caps, trigger rates, participation rates, buffers, floors, fees, and available strategy terms can change. Hypothetical index performance shown does not predict future results. Index returns shown are price-return assumptions and do not include dividends unless otherwise stated. Product fees, riders, taxes, and surrender charges may materially affect actual results.
          </footer>
        </section>
      </div>
    </main>
  );
}
