"use client";

import { useMemo, useState } from "react";
import { BarChart3, FileText, GitCompareArrows, LayoutDashboard } from "lucide-react";
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
  { id: "overview", label: "Advisor Dashboard", icon: LayoutDashboard },
  { id: "scenario", label: "Scenario Builder", icon: BarChart3 },
  { id: "compare", label: "Compare Strategies", icon: GitCompareArrows },
  { id: "print", label: "Presentation View", icon: FileText }
] as const;

const scenarioSnapshots = [
  { label: "Up market", value: 0.18 },
  { label: "Flat market", value: 0 },
  { label: "Mild down", value: -0.08 },
  { label: "Severe down", value: -0.25 }
];

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
  const snapshots = useMemo(
    () =>
      scenarioSnapshots.map((snapshot) => ({
        ...snapshot,
        result: calculateStrategyOutcome(strategy, snapshot.value, startingPremium, inputs)
      })),
    [strategy, startingPremium, inputs]
  );

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-12 pt-5 lg:px-8" data-testid="app-root">
      <header className="no-print mb-6 rounded-[28px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-6 text-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">RILA advisor platform</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">Structured Outcome Studio</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300 lg:text-base">Separate recommendation, modeling, comparison, and presentation workflows with one consistent strategy engine.</p>
          </div>
          <button className="rounded-xl border border-slate-600 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">Export Meeting Pack</button>
        </div>
        <nav className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                data-testid={`tab-${t.id}`}
                className={`inline-flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                  tab === t.id
                    ? "border-white/70 bg-white text-slate-900 shadow-lg"
                    : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
                }`}
              >
                <span className="font-medium">{t.label}</span>
                <Icon size={16} />
              </button>
            );
          })}
        </nav>
      </header>

      {tab === "overview" && (
        <AdvisorDashboard
          strategyName={inputs.labelOverride || strategy.label}
          strategyId={strategy.id}
          strategyDescription={strategy.description}
          strategyTradeoff={strategy.tradeoff}
          strongestWhen={strategy.strongestWhen}
          strategyInputs={inputs}
          outcome={outcome}
          marketReturn={marketReturn}
          snapshots={snapshots}
          clientName={clientName}
          setClientName={setClientName}
        />
      )}

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
        <CompareStrategies startingPremium={startingPremium} marketReturn={marketReturn} roundToDollar={roundToDollar} />
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

function AdvisorDashboard({
  strategyName,
  strategyId,
  strategyDescription,
  strategyTradeoff,
  strongestWhen,
  strategyInputs,
  outcome,
  marketReturn,
  snapshots,
  clientName,
  setClientName
}: {
  strategyName: string;
  strategyId: StrategyId;
  strategyDescription: string;
  strategyTradeoff: string;
  strongestWhen: string;
  strategyInputs: StrategyInputs;
  outcome: StrategyResult;
  marketReturn: number;
  snapshots: Array<{ label: string; value: number; result: StrategyResult }>;
  clientName: string;
  setClientName: (name: string) => void;
}) {
  const downside = strategyId.includes("protection")
    ? "Client is insulated from negative index years (credited 0% minimum)."
    : strategyInputs.floor
      ? `Downside floor limits losses to ${pct(strategyInputs.floor)}.`
      : strategyInputs.buffer
        ? `First ${pct(strategyInputs.buffer)} of downside is buffered before losses apply.`
        : "Downside is linked to market behavior.";

  const upside = strategyInputs.cap
    ? `Upside participation is capped at ${pct(strategyInputs.cap)}.`
    : strategyInputs.triggerRate
      ? `Upside is a preset trigger credit of ${pct(strategyInputs.triggerRate)} in qualifying years.`
      : strategyInputs.participationRate
        ? `Upside participates at ${pct(strategyInputs.participationRate, 0)} of index gains.`
        : "Upside varies by design.";

  return (
    <section className="space-y-6">
      <article className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top recommendation</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{strategyName}</h2>
            <p className="mt-3 text-base text-slate-700">{strategyDescription}</p>
            <div className="mt-6 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Recommendation summary:</span> For the current {pct(marketReturn)} market assumption, this structure credits {pct(outcome.creditedReturn)} with projected ending value {currency(outcome.endingValue)}.</p>
              <p><span className="font-semibold text-slate-900">Downside protection:</span> {downside}</p>
              <p><span className="font-semibold text-slate-900">Upside tradeoff:</span> {upside}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current scenario outcome</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{currency(outcome.endingValue)}</p>
            <p className="mt-1 text-sm text-slate-600">Ending value from {currency(100000)} baseline</p>
            <div className="mt-5 grid gap-3 text-sm">
              <MetricRow label="Market assumption" value={pct(marketReturn)} />
              <MetricRow label="Credited return" value={pct(outcome.creditedReturn)} />
              <MetricRow label="Protection type" value={strategyId.includes("protection") ? "Principal" : "Buffered/Floor"} />
            </div>
          </div>
        </div>
      </article>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-lg">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.17em] text-slate-500">Scenario snapshot strip</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {snapshots.map((snapshot) => (
            <div key={snapshot.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{snapshot.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{currency(snapshot.result.endingValue)}</p>
              <p className="text-xs text-slate-600">Credited {pct(snapshot.result.creditedReturn)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[22px] border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Key terms at a glance</h3>
          <div className="mt-4 grid gap-2 text-sm">
            <MetricRow label="Buffer" value={strategyInputs.buffer ? pct(strategyInputs.buffer) : "N/A"} />
            <MetricRow label="Cap" value={strategyInputs.cap ? pct(strategyInputs.cap) : "N/A"} />
            <MetricRow label="Trigger" value={strategyInputs.triggerRate ? pct(strategyInputs.triggerRate) : "N/A"} />
            <MetricRow label="Floor" value={strategyInputs.floor ? pct(strategyInputs.floor) : "N/A"} />
            <MetricRow label="Participation" value={strategyInputs.participationRate ? pct(strategyInputs.participationRate, 0) : "N/A"} />
            <MetricRow label="Term" value="1-year illustration" />
          </div>
        </article>

        <article className="rounded-[22px] border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Advisor talking points</h3>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">What this strategy is designed to do</p>
              <p>{strategyDescription}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">What the client is giving up</p>
              <p>{strategyTradeoff}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">When this tends to work best</p>
              <p>{strongestWhen}</p>
            </div>
          </div>
        </article>
      </section>

      <article className="rounded-[22px] border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Meeting prep notes</h3>
        <p className="mt-2 text-sm text-slate-600">Capture client-specific notes before moving to presentation mode.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client name</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <textarea placeholder="Suitability notes, goals, and objection handling prompts..." className="min-h-[110px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </article>
    </section>
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Scenario Builder Workspace</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Model assumptions and see payoff behavior in real time</h2>
      </header>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="no-print space-y-4 xl:sticky xl:top-4 xl:h-fit">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Inputs</p>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-400">Strategy</label>
            <select data-testid="strategy-select" value={strategyId} onChange={(e) => setStrategyId(e.target.value as StrategyId)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
              {strategyConfigs.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <div data-testid="premium-input-wrap">
              <Field label="Premium" value={startingPremium} onChange={setStartingPremium} min={0} step={1000} suffix="" theme="dark" />
            </div>
            <label className="text-sm font-medium">Market scenario ({pct(marketReturn)})</label>
            <input data-testid="market-slider" type="range" min={-0.4} max={0.4} step={0.005} value={marketReturn} onChange={(e) => setMarketReturn(Number(e.target.value))} className="mt-2 w-full accent-emerald-400" />
            <div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>-40%</span><span>0%</span><span>+40%</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2" data-testid="scenario-presets">
              {scenarioPresets.map((p) => (
                <button key={p.label} onClick={() => setMarketReturn(p.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs hover:bg-slate-700">{p.label}</button>
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

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl lg:p-6">
          <PayoffChart strategy={strategy} inputs={strategyInputs} data={payoffData} marketReturn={marketReturn} creditedReturn={outcome.creditedReturn} startingPremium={startingPremium} endingValue={outcome.endingValue} scenarioExplanation={outcome.explanation} />
        </section>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:h-fit">
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live scenario</p>
            <p className="mt-3 text-sm text-slate-300">{pct(marketReturn)} market</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight" data-testid="live-credited-return">{pct(outcome.creditedReturn)}</p>
            <p className="mt-1 text-sm text-slate-300">Credited return</p>
            <div className="mt-4 border-t border-slate-700 pt-4">
              <p className="text-xs text-slate-400">Ending value</p>
              <p className="text-2xl font-semibold" data-testid="live-ending-value">{currency(outcome.endingValue, roundToDollar)}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Protection type</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{strategy.protectionType}</p>
            <p className="mt-3 text-sm text-slate-700">{outcome.explanation}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tradeoff panel</p>
            <p className="mt-2 text-sm text-slate-700">{strategy.tradeoff}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-2 text-sm last:border-b-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
