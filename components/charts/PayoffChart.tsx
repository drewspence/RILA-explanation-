"use client";

import { pct, currency } from "@/lib/formatters";
import { buildClientFriendlyScenarios } from "@/lib/calculations/payoffVisualization";
import { StrategyConfig, StrategyInputs } from "@/types/strategy";

interface Props {
  strategy: StrategyConfig;
  inputs: StrategyInputs;
  data: Array<{ market: number; credited: number }>;
  marketReturn: number;
  creditedReturn: number;
  startingPremium: number;
  endingValue: number;
  scenarioExplanation: string;
}

export function PayoffChart({
  strategy,
  inputs,
  marketReturn,
  creditedReturn,
  startingPremium,
  endingValue,
  scenarioExplanation
}: Props) {
  const scenarios = buildClientFriendlyScenarios(strategy, inputs);
  const activeScenario = {
    title: "Selected scenario",
    market: marketReturn,
    credited: creditedReturn,
    note: scenarioExplanation
  };

  return (
    <div className="space-y-5">
      <header className="mb-1 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Strategy visual</p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">What the market did vs. what gets credited</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Blue shows the index return. Green shows the performance credit after the contract rule is applied.
          </p>
        </div>
        <Legend />
      </header>

      <div data-testid="payoff-chart" className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <MiniScenarioCard key={scenario.title} scenario={scenario} />
          ))}
        </div>
      </div>

      <div data-testid="active-scenario-card" className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-slate-700">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Selected scenario</p>
            <p className="mt-1 font-medium text-slate-950">This row updates from the market slider and calculation engine.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-right text-xs sm:min-w-[360px]">
            <Metric label="Index return" value={pct(activeScenario.market)} valueClassName="text-blue-800" />
            <Metric label="Performance credit" value={pct(activeScenario.credited)} valueClassName="text-emerald-700" />
            <Metric label="Ending value" value={currency(endingValue)} valueClassName="text-slate-950" />
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-slate-600">{activeScenario.note}</p>
        <p className="mt-2 text-xs text-slate-500">Starting premium: {currency(startingPremium)}</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What this means</p>
        <p className="mt-2 max-w-3xl">{buildPlainEnglishSummary(strategy, inputs)}</p>
      </section>
    </div>
  );
}

type Scenario = ReturnType<typeof buildClientFriendlyScenarios>[number];

function MiniScenarioCard({ scenario }: { scenario: Scenario }) {
  const referenceValue = scenario.referenceLine?.value ?? 0;
  const maxMagnitude = Math.max(0.2, Math.abs(scenario.market), Math.abs(scenario.credited), Math.abs(referenceValue));
  const chartHeight = 168;
  const halfHeight = chartHeight / 2;

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4" data-testid="mini-payoff-card">
      <div className="min-h-[74px]">
        <p className="text-sm font-semibold text-slate-950">{scenario.title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{scenario.note}</p>
      </div>

      <div className="relative mt-3 h-[168px] rounded-2xl border border-slate-200 bg-white px-5 py-3">
        <div className="absolute left-4 right-4 top-1/2 border-t border-slate-400" aria-hidden="true" />
        <span className="absolute left-2 top-[calc(50%-9px)] bg-white pr-1 text-[10px] font-medium text-slate-500">0%</span>

        {scenario.referenceLine && (
          <ReferenceRule line={scenario.referenceLine} maxMagnitude={maxMagnitude} halfHeight={halfHeight} />
        )}

        <div className="absolute inset-x-0 top-3 flex h-[144px] items-center justify-center gap-8">
          <VerticalBar value={scenario.market} maxMagnitude={maxMagnitude} colorClassName="bg-blue-800" label="Index" />
          <VerticalBar value={scenario.credited} maxMagnitude={maxMagnitude} colorClassName="bg-emerald-500" label="Credit" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <ValuePill label="Index return" value={pct(scenario.market)} className="text-blue-800" />
        <ValuePill label="Performance credit" value={pct(scenario.credited)} className="text-emerald-700" />
      </div>
    </article>
  );
}

function VerticalBar({
  value,
  maxMagnitude,
  colorClassName,
  label
}: {
  value: number;
  maxMagnitude: number;
  colorClassName: string;
  label: string;
}) {
  const barHeight = Math.max(4, Math.round((Math.abs(value) / maxMagnitude) * 72));
  const positioning = value >= 0 ? { bottom: "50%", height: `${barHeight}px` } : { top: "50%", height: `${barHeight}px` };

  return (
    <div className="relative h-full w-14">
      <span
        className={`absolute left-1/2 w-8 -translate-x-1/2 rounded-t-md ${value < 0 ? "rounded-b-md rounded-t-none" : ""} ${colorClassName}`}
        style={positioning}
        aria-label={`${label}: ${pct(value)}`}
      />
      <span className={`absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold ${value >= 0 ? "bottom-[calc(50%+6px)]" : "top-[calc(50%+6px)]"} ${label === "Index" ? "text-blue-800" : "text-emerald-700"}`}>
        {pct(value)}
      </span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

function ReferenceRule({
  line,
  maxMagnitude,
  halfHeight
}: {
  line: NonNullable<Scenario["referenceLine"]>;
  maxMagnitude: number;
  halfHeight: number;
}) {
  const offset = (line.value / maxMagnitude) * (halfHeight - 12);
  const top = `calc(50% - ${offset}px)`;

  return (
    <div className="absolute left-4 right-4 z-10 border-t border-dashed border-slate-400" style={{ top }} aria-label={`${line.label} reference line`}>
      <span className="absolute -right-1 -top-5 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm">
        {line.label}
      </span>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-blue-800" /> Index return</span>
      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-emerald-500" /> Performance credit</span>
    </div>
  );
}

function Metric({ label, value, valueClassName }: { label: string; value: string; valueClassName: string }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function ValuePill({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${className}`}>{value}</p>
    </div>
  );
}

function buildPlainEnglishSummary(strategy: StrategyConfig, inputs: StrategyInputs) {
  const buffer = inputs.buffer ?? strategy.defaults.buffer;
  const cap = inputs.cap ?? strategy.defaults.cap;
  const floor = inputs.floor ?? strategy.defaults.floor;
  const triggerRate = inputs.triggerRate ?? strategy.defaults.triggerRate;

  if (strategy.protectionType.includes("Buffer") && typeof buffer === "number") {
    const upsideRule = typeof cap === "number" ? ` If the market is positive, gains are credited up to the ${pct(cap)} cap.` : " If the market is positive, gains are credited using the selected upside rule.";
    return `With a ${pct(buffer)} buffer, the first ${pct(buffer)} of market loss is absorbed.${upsideRule} This gives clients a clearer tradeoff: some downside protection in exchange for limited upside or a defined crediting rule.`;
  }

  if (strategy.id === "guard" && typeof floor === "number") {
    return `The floor limits credited losses to ${pct(floor)}. If the market is positive, gains are credited up to the ${pct(cap ?? 0)} cap.`;
  }

  if (strategy.protectionType === "Principal Protection") {
    const upsideRule = typeof cap === "number" ? `positive returns can be credited up to the ${pct(cap)} cap` : `positive returns can receive the ${pct(triggerRate ?? 0)} trigger credit`;
    return `Negative index returns receive a 0% performance credit, while ${upsideRule}.`;
  }

  return strategy.description;
}
