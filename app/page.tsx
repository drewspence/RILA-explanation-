"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  FileText,
  GitCompareArrows,
  Info,
  LayoutDashboard,
  MoonStar,
  Scale,
  Shield,
  TrendingUp
} from "lucide-react";
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
  const snapshots = useMemo(
    () =>
      scenarioSnapshots.map((snapshot) => ({
        ...snapshot,
        result: calculateStrategyOutcome(strategy, snapshot.value, startingPremium, inputs)
      })),
    [strategy, startingPremium, inputs]
  );

  return (
    <main className="mx-auto max-w-[1900px] px-0 pb-12 pt-0">
      <header className="no-print mb-0 border-b border-slate-800 bg-gradient-to-r from-[#031738] via-[#03224a] to-[#031738] px-6 py-4 text-white shadow-2xl lg:px-14">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight lg:text-6xl">RILA <span className="text-xl font-medium text-cyan-400">DEMO</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-slate-500 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/20">Save Scenario</button>
            <button className="rounded-xl border border-slate-600 p-2.5 text-slate-300 transition hover:bg-white/10">
              <MoonStar size={18} />
            </button>
          </div>
        </div>
        <nav className="mt-3 flex flex-wrap gap-2">
          {tabs.map((t) => {
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center justify-between rounded-lg border px-5 py-2.5 text-sm transition ${
                  tab === t.id
                    ? "border-cyan-300/70 bg-white/10 text-white shadow-lg"
                    : "border-transparent bg-transparent text-slate-200 hover:border-slate-500"
                }`}
              >
                <span className="font-medium">{t.label}</span>
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
  const currentStrategy = strategyInputs.labelOverride || strategy.label;
  const bufferValue = decimalToUiPercent(strategyInputs.buffer ?? 0.1);
  const capValue = decimalToUiPercent(strategyInputs.cap ?? 0.12);
  const marketValue = decimalToUiPercent(marketReturn);

  const strategySummary = [
    { label: "Buffer", value: `${bufferValue.toFixed(0)}%` },
    { label: "Cap", value: `${capValue.toFixed(0)}%` },
    { label: "Type", value: strategy.protectionType === "Buffer" ? "Buffered Cap" : strategy.protectionType },
    { label: "Participation", value: `${decimalToUiPercent(strategyInputs.participationRate ?? 1).toFixed(0)}%` },
    { label: "Upside Limit", value: `${capValue.toFixed(0)}%` },
    { label: "Protection Level", value: `First ${bufferValue.toFixed(0)}%` }
  ];

  return (
    <section className="bg-[#f7f9fc]">
      <div className="grid gap-0 xl:grid-cols-[390px_minmax(0,1fr)_420px]">
        <aside className="no-print min-h-[calc(100vh-88px)] space-y-6 border-r border-slate-200 bg-white px-8 py-8">
          <div className="space-y-3">
            <h3 className="text-[42px] font-semibold tracking-tight text-slate-900">1. Market Scenario</h3>
            <p className="text-xl leading-relaxed text-slate-600">Adjust the market return to see how strategies perform.</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[38px] font-semibold text-slate-900">Market Return</span>
              <span className="rounded-xl bg-rose-100 px-4 py-2 text-4xl font-semibold text-rose-600">{pct(marketReturn)}</span>
            </div>
            <input type="range" min={-0.5} max={0.5} step={0.005} value={marketReturn} onChange={(e) => setMarketReturn(Number(e.target.value))} className="mt-2 w-full accent-blue-900" />
            <div className="flex justify-between text-3xl font-medium text-slate-500"><span>-50%</span><span>0%</span><span>50%</span></div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-[42px] font-semibold tracking-tight text-slate-900">2. Strategy Selection</h3>
            <p className="mt-2 text-xl text-slate-600">Choose the strategy you&apos;d like to explore.</p>
            <select value={strategyId} onChange={(e) => setStrategyId(e.target.value as StrategyId)} className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-3xl font-medium text-slate-900">
              {strategyConfigs.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-[42px] font-semibold tracking-tight text-slate-900">3. Strategy Terms</h3>
            <p className="mt-2 text-xl text-slate-600">Adjust the terms of the strategy.</p>
            <input type="text" value={strategyInputs.labelOverride || ""} onChange={(e) => setLabelInput(e.target.value)} placeholder="Optional strategy label" className="mb-4 mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-base" />
            {activeKeys.includes("buffer") && <Field label="Buffer" value={bufferValue} onChange={(v) => setDecimalInput("buffer", uiPercentToDecimal(Math.min(30, Math.max(5, v))))} min={5} max={30} step={1} />}
            {activeKeys.includes("cap") && <Field label="Cap" value={capValue} onChange={(v) => setDecimalInput("cap", uiPercentToDecimal(Math.min(30, Math.max(5, v))))} min={5} max={30} step={1} />}
            <Field label="Premium" value={startingPremium} onChange={setStartingPremium} min={50000} step={5000} suffix="" />
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={roundToDollar} onChange={(e) => setRoundToDollar(e.target.checked)} /> Round to nearest dollar</label>
            <p className="mt-6 rounded-2xl bg-slate-100 p-4 text-base text-slate-600">These strategies do not protect against losses beyond the buffer and may underperform in strong markets.</p>
          </div>
        </aside>

        <section className="space-y-6 px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-5xl font-semibold tracking-tight text-slate-900">How a {capValue.toFixed(0)}% Buffered Cap Works</h2>
              <p className="mt-2 text-2xl text-slate-600">See how the strategy transforms market returns into your returns.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 text-xl font-medium text-slate-600"><Info size={22} /> View Details</button>
          </div>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <PayoffChart strategy={strategy} inputs={strategyInputs} data={payoffData} marketReturn={marketReturn} creditedReturn={outcome.creditedReturn} startingPremium={startingPremium} endingValue={outcome.endingValue} scenarioExplanation={outcome.explanation} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-4xl font-semibold text-slate-900">What This Means</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-3xl font-semibold text-slate-900">If the market drops 8%</p>
                <p className="mt-2 text-xl text-slate-600">You lose 0%. The buffer absorbs the loss.</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-3xl font-semibold text-slate-900">If the market drops 15%</p>
                <p className="mt-2 text-xl text-slate-600">You lose 5%. The first 10% is absorbed.</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-3xl font-semibold text-slate-900">If the market gains 12%</p>
                <p className="mt-2 text-xl text-slate-600">You gain 10%. Your return is capped at 10%.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-3xl font-semibold text-slate-900">Quick Scenarios</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {scenarioPresets.map((p) => (
                <button key={p.label} onClick={() => setMarketReturn(p.value)} className={`rounded-2xl border px-4 py-3 text-left text-lg font-semibold ${Math.abs(marketReturn - p.value) < 0.0005 ? "border-blue-800 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                  Market {pct(p.value)}
                  <span className="block text-sm font-medium text-slate-500">{p.label}</span>
                </button>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-4 border-l border-slate-200 bg-[#f7f9fc] px-8 py-8">
          <div className="rounded-2xl border border-slate-900 bg-gradient-to-br from-[#06204a] to-[#04122b] p-6 text-white">
            <p className="text-5xl font-semibold">Current Scenario</p>
            <div className="mt-4 flex items-center justify-between text-2xl text-slate-200">
              <span>Market Return</span>
              <span className="rounded-xl bg-rose-900/60 px-4 py-1.5 font-semibold text-rose-100">{pct(marketReturn)}</span>
            </div>
            <div className="mt-5 border-t border-blue-200/20 pt-5">
              <p className="text-2xl font-semibold text-slate-200">Your Strategy Return</p>
              <p className="mt-1 text-7xl font-bold tracking-tight">{pct(outcome.creditedReturn)}</p>
              <p className="mt-2 text-lg text-slate-300">You&apos;re protected by the {bufferValue.toFixed(0)}% buffer.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-4xl font-semibold text-slate-900">Strategy Summary</h3>
            <div className="mt-4 space-y-2">
              {strategySummary.map((item) => (
                <MetricRow key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-4xl font-semibold text-slate-900">Key Benefits</h3>
            <div className="mt-5 space-y-5">
              <Benefit icon={<Shield className="text-blue-700" />} title="Downside Protection" copy={`The buffer helps protect against the first ${bufferValue.toFixed(0)}% of market losses.`} />
              <Benefit icon={<TrendingUp className="text-emerald-600" />} title="Capped Growth" copy={`Participate in market gains up to the ${capValue.toFixed(0)}% cap.`} />
              <Benefit icon={<Scale className="text-indigo-600" />} title="Defined Outcome" copy="Know your potential return range in any market condition." />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-3xl font-semibold text-slate-900">Compare Strategies</h3>
            <p className="mt-2 text-lg text-slate-600">See how this strategy stacks up against other options.</p>
            <p className="mt-3 text-base text-slate-500">{currentStrategy}</p>
            <p className="text-base text-slate-500">Market: {marketValue.toFixed(1)}%</p>
            <p className="text-base text-slate-500">Ending value: {currency(outcome.endingValue, roundToDollar)}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-2 text-2xl last:border-b-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function Benefit({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-slate-100 p-2">{icon}</div>
      <div>
        <p className="text-2xl font-semibold text-slate-900">{title}</p>
        <p className="text-lg text-slate-600">{copy}</p>
      </div>
    </div>
  );
}
