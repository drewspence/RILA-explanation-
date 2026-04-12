"use client";

import { useMemo, useState } from "react";
import { BarChart3, FileText, GitCompareArrows, LayoutDashboard } from "lucide-react";
import { HeroOutcomeCard } from "@/components/strategy/HeroOutcomeCard";
import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Field } from "@/components/shared/Field";
import { strategyById, strategyConfigs } from "@/lib/strategyConfigs";
import { StrategyId, StrategyInputs } from "@/types/strategy";
import { calculateStrategyOutcome, buildPayoffData, visibleInputKeys } from "@/lib/calculations/engine";
import { decimalToUiPercent, pct, uiPercentToDecimal } from "@/lib/formatters";
import { PayoffChart } from "@/components/charts/PayoffChart";
import { scenarioPresets } from "@/lib/scenarioPresets";
import { ExplainerPanel } from "@/components/strategy/ExplainerPanel";
import { CompareStrategies } from "@/components/compare/CompareStrategies";
import { StrategyEducationCards } from "@/components/strategy/StrategyEducationCards";
import { AdvisorDetailsDrawer } from "@/components/strategy/AdvisorDetailsDrawer";
import { PresentationView } from "@/components/print/PresentationView";

const tabs = [
  { id: "overview", label: "Advisor Dashboard", icon: LayoutDashboard },
  { id: "scenario", label: "Scenario Builder", icon: BarChart3 },
  { id: "compare", label: "Compare Strategies", icon: GitCompareArrows },
  { id: "print", label: "Presentation View", icon: FileText }
] as const;

export default function HomePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("overview");
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
    <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-5 lg:px-8">
      <header className="mb-6 rounded-3xl border border-slate-200 bg-white/90 px-6 py-5 shadow-premium backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">RILA advisor studio</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">Structured Outcome Illustration</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Build clear, client-ready scenarios that show downside protection, upside tradeoffs, and projected ending value.</p>
          </div>
          <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Export Meeting Summary</button>
        </div>
        <nav className="no-print mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  tab === t.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="no-print space-y-5">
          <Card tone="dark" className="text-white">
            <SectionHeader
              title="Scenario Builder"
              subtitle="Set assumptions and immediately see payoff behavior"
              invert
            />
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-300">Strategy design</label>
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value as StrategyId)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              {strategyConfigs.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <Field label="Client premium" value={startingPremium} onChange={setStartingPremium} min={0} step={1000} suffix="" theme="dark" />
            <div className="mt-4">
              <label className="text-sm font-medium text-slate-100">Market scenario ({pct(marketReturn)})</label>
              <input
                type="range"
                min={-0.4}
                max={0.4}
                step={0.005}
                value={marketReturn}
                onChange={(e) => setMarketReturn(Number(e.target.value))}
                className="mt-2 w-full accent-emerald-400"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-300"><span>-40%</span><span>Flat</span><span>+40%</span></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {scenarioPresets.map((p) => (
                <button key={p.label} onClick={() => setMarketReturn(p.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs hover:bg-slate-700">
                  {p.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Strategy Terms" subtitle="Only fields relevant to this design are shown" />
            <input
              type="text"
              value={inputs.labelOverride || ""}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Optional custom strategy label"
              className="mb-3 w-full rounded-xl border border-slate-300 p-2 text-sm"
            />
            {activeKeys.includes("buffer") && (
              <Field label="Downside buffer" value={decimalToUiPercent(inputs.buffer ?? 0.1)} onChange={(v) => setDecimalInput("buffer", uiPercentToDecimal(Math.min(40, Math.max(0, v))))} min={0} max={40} step={0.5} />
            )}
            {activeKeys.includes("floor") && (
              <Field label="Floor" value={decimalToUiPercent(inputs.floor ?? -0.1)} onChange={(v) => setDecimalInput("floor", uiPercentToDecimal(Math.min(0, Math.max(-40, v))))} min={-40} max={0} step={0.5} />
            )}
            {activeKeys.includes("cap") && (
              <Field label="Upside cap" value={decimalToUiPercent(inputs.cap ?? 0.12)} onChange={(v) => setDecimalInput("cap", uiPercentToDecimal(Math.min(50, Math.max(0, v))))} min={0} max={50} step={0.5} />
            )}
            {activeKeys.includes("triggerRate") && (
              <Field label="Trigger credit" value={decimalToUiPercent(inputs.triggerRate ?? 0.09)} onChange={(v) => setDecimalInput("triggerRate", uiPercentToDecimal(Math.min(20, Math.max(0, v))))} min={0} max={20} step={0.5} />
            )}
            {activeKeys.includes("participationRate") && (
              <Field label="Participation" value={decimalToUiPercent(inputs.participationRate ?? 1)} onChange={(v) => setDecimalInput("participationRate", uiPercentToDecimal(Math.min(200, Math.max(0, v))))} min={0} max={200} step={5} />
            )}
            <label className="mt-4 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={roundToDollar} onChange={(e) => setRoundToDollar(e.target.checked)} /> Round output to nearest dollar</label>
          </Card>
        </aside>

        <section className="space-y-5">
          <HeroOutcomeCard
            strategyName={inputs.labelOverride || strategy.label}
            marketReturn={marketReturn}
            creditedReturn={outcome.creditedReturn}
            endingValue={outcome.endingValue}
            dollarChange={outcome.dollarChange}
            explanation={outcome.explanation}
            roundToDollar={roundToDollar}
            protectionType={strategy.protectionType}
          />

          {(tab === "overview" || tab === "scenario") && (
            <Card>
              <SectionHeader title="Payoff Visualization" subtitle="Visual zones explain protection, loss exposure, and upside limits" />
              <PayoffChart
                strategy={strategy}
                inputs={inputs}
                data={payoffData}
                marketReturn={marketReturn}
                creditedReturn={outcome.creditedReturn}
                startingPremium={startingPremium}
                endingValue={outcome.endingValue}
                scenarioExplanation={outcome.explanation}
              />
            </Card>
          )}

          {(tab === "overview" || tab === "scenario") && (
            <ExplainerPanel strategy={strategy} marketReturn={marketReturn} creditedReturn={outcome.creditedReturn} inputs={inputs} />
          )}

          {tab === "overview" && <StrategyEducationCards />}

          {tab === "compare" && (
            <CompareStrategies
              startingPremium={startingPremium}
              marketReturn={marketReturn}
              roundToDollar={roundToDollar}
            />
          )}

          <AdvisorDetailsDrawer strategy={strategy} inputs={inputs} />

          {tab === "print" && (
            <>
              <Card className="no-print">
                <label className="text-sm font-medium text-slate-700">Client name</label>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-2 w-full rounded-xl border p-2" />
              </Card>
              <PresentationView
                strategy={inputs.labelOverride || strategy.label}
                clientName={clientName}
                marketReturn={marketReturn}
                result={outcome}
                assumptions={activeKeys.map((key) => `${key}: ${pct((inputs[key] as number) ?? 0)}`)}
              />
            </>
          )}

          <footer className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500">
            This tool is for educational illustration only. Actual rates, charges, rider details, and contract terms vary by carrier and issue date.
          </footer>
        </section>
      </section>
    </main>
  );
}
