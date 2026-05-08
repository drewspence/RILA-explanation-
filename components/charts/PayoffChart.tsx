"use client";

import { pct, currency } from "@/lib/formatters";
import { buildClientFriendlyScenarios, ClientFriendlyScenario } from "@/lib/calculations/payoffVisualization";
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

type ReferenceLine = NonNullable<ClientFriendlyScenario["referenceLine"]>;

export function PayoffChart({
  strategy,
  inputs,
  marketReturn,
  creditedReturn,
  startingPremium,
  endingValue,
  scenarioExplanation
}: Props) {
  const exampleScenarios = buildClientFriendlyScenarios(strategy, inputs);
  const liveScenario: ClientFriendlyScenario = {
    title: `If the market return is ${pct(marketReturn)}`,
    market: marketReturn,
    credited: creditedReturn,
    note: scenarioExplanation
  };
  const referenceLines = getReferenceLines(strategy, inputs);

  return (
    <div className="space-y-5">
      <header className="mb-1 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Strategy visual</p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">If the market return is X%, what gets credited?</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Move the market slider to update the blue index return bar and green performance credit bar in real time.
          </p>
        </div>
        <Legend />
      </header>

      <section data-testid="payoff-chart" className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <LiveScenarioCard
          scenario={liveScenario}
          referenceLines={referenceLines}
          endingValue={endingValue}
          startingPremium={startingPremium}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What this means</p>
        <p className="mt-2 max-w-3xl">{buildPlainEnglishSummary(strategy, inputs)}</p>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Example scenarios</p>
          <p className="mt-1 text-sm text-slate-600">Reference examples for how the current contract rules work in different markets.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {exampleScenarios.map((scenario) => (
            <ExampleScenarioCard key={scenario.title} scenario={scenario} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LiveScenarioCard({
  scenario,
  referenceLines,
  endingValue,
  startingPremium
}: {
  scenario: ClientFriendlyScenario;
  referenceLines: ReferenceLine[];
  endingValue: number;
  startingPremium: number;
}) {
  return (
    <article data-testid="active-scenario-card" className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Live scenario</p>
          <h4 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{scenario.title}</h4>
          <p data-testid="live-scenario-explanation" className="mt-2 max-w-2xl text-sm text-slate-700">{scenario.note}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right text-xs sm:min-w-[380px]">
          <Metric label="Index return" value={pct(scenario.market)} valueClassName="text-blue-800" testId="live-index-return-value" />
          <Metric label="Performance credit" value={pct(scenario.credited)} valueClassName="text-emerald-700" testId="live-performance-credit-value" />
          <Metric label="Ending value" value={currency(endingValue)} valueClassName="text-slate-950" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <BarComparisonChart scenario={scenario} referenceLines={referenceLines} size="large" />
      </div>

      <p className="mt-3 text-xs text-slate-500">Starting premium: {currency(startingPremium)}</p>
    </article>
  );
}

function ExampleScenarioCard({ scenario }: { scenario: ClientFriendlyScenario }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4" data-testid="mini-payoff-card">
      <div className="min-h-[74px]">
        <p className="text-sm font-semibold text-slate-950">{scenario.title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{scenario.note}</p>
      </div>

      <BarComparisonChart scenario={scenario} referenceLines={scenario.referenceLine ? [scenario.referenceLine] : []} size="compact" />

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <ValuePill label="Index return" value={pct(scenario.market)} className="text-blue-800" />
        <ValuePill label="Performance credit" value={pct(scenario.credited)} className="text-emerald-700" />
      </div>
    </article>
  );
}

function BarComparisonChart({
  scenario,
  referenceLines,
  size
}: {
  scenario: ClientFriendlyScenario;
  referenceLines: ReferenceLine[];
  size: "large" | "compact";
}) {
  const maxMagnitude = Math.max(
    0.4,
    Math.abs(scenario.market),
    Math.abs(scenario.credited),
    ...referenceLines.map((line) => Math.abs(line.value))
  );
  const chartHeight = size === "large" ? 260 : 168;
  const barMaxHeight = size === "large" ? 112 : 72;
  const barGap = size === "large" ? "gap-16" : "gap-8";

  return (
    <div className={`relative mt-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 ${size === "large" ? "h-[260px]" : "h-[168px]"}`}>
      <div className="absolute left-4 right-4 top-1/2 border-t border-slate-400" aria-hidden="true" />
      <span className="absolute left-2 top-[calc(50%-9px)] bg-white pr-1 text-[10px] font-medium text-slate-500">0%</span>

      {referenceLines.map((line, index) => (
        <ReferenceRule
          key={`${line.label}-${line.value}`}
          line={line}
          maxMagnitude={maxMagnitude}
          chartHeight={chartHeight}
          labelOffset={index * 18}
        />
      ))}

      <div className={`absolute inset-x-0 top-3 flex items-center justify-center ${barGap}`} style={{ height: chartHeight - 24 }}>
        <VerticalBar
          value={scenario.market}
          maxMagnitude={maxMagnitude}
          maxHeight={barMaxHeight}
          colorClassName="bg-blue-800"
          label="Index"
          valueTestId={size === "large" ? "live-index-bar-label" : undefined}
          barTestId={size === "large" ? "live-index-bar" : undefined}
        />
        <VerticalBar
          value={scenario.credited}
          maxMagnitude={maxMagnitude}
          maxHeight={barMaxHeight}
          colorClassName="bg-emerald-500"
          label="Credit"
          valueTestId={size === "large" ? "live-credit-bar-label" : undefined}
          barTestId={size === "large" ? "live-credit-bar" : undefined}
        />
      </div>
    </div>
  );
}

function VerticalBar({
  value,
  maxMagnitude,
  maxHeight,
  colorClassName,
  label,
  valueTestId,
  barTestId
}: {
  value: number;
  maxMagnitude: number;
  maxHeight: number;
  colorClassName: string;
  label: string;
  valueTestId?: string;
  barTestId?: string;
}) {
  const barHeight = Math.max(4, Math.round((Math.abs(value) / maxMagnitude) * maxHeight));
  const positioning = value >= 0 ? { bottom: "50%", height: `${barHeight}px` } : { top: "50%", height: `${barHeight}px` };

  return (
    <div className="relative h-full w-16">
      <span
        data-testid={barTestId}
        className={`absolute left-1/2 w-9 -translate-x-1/2 rounded-t-md ${value < 0 ? "rounded-b-md rounded-t-none" : ""} ${colorClassName}`}
        style={positioning}
        aria-label={`${label}: ${pct(value)}`}
      />
      <span
        data-testid={valueTestId}
        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-semibold ${value >= 0 ? "bottom-[calc(50%+6px)]" : "top-[calc(50%+6px)]"} ${label === "Index" ? "text-blue-800" : "text-emerald-700"}`}
      >
        {pct(value)}
      </span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

function ReferenceRule({
  line,
  maxMagnitude,
  chartHeight,
  labelOffset
}: {
  line: ReferenceLine;
  maxMagnitude: number;
  chartHeight: number;
  labelOffset: number;
}) {
  const offset = (line.value / maxMagnitude) * (chartHeight / 2 - 12);
  const top = `calc(50% - ${offset}px)`;

  return (
    <div className="absolute left-4 right-4 z-10 border-t border-dashed border-slate-400" style={{ top }} aria-label={`${line.label} reference line`}>
      <span className="absolute -right-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm" style={{ top: -20 - labelOffset }}>
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

function Metric({ label, value, valueClassName, testId }: { label: string; value: string; valueClassName: string; testId?: string }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p data-testid={testId} className={`mt-1 text-base font-semibold ${valueClassName}`}>{value}</p>
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

function getReferenceLines(strategy: StrategyConfig, inputs: StrategyInputs): ReferenceLine[] {
  const lines: ReferenceLine[] = [];
  const buffer = inputs.buffer ?? strategy.defaults.buffer;
  const cap = inputs.cap ?? strategy.defaults.cap;
  const floor = inputs.floor ?? strategy.defaults.floor;
  const triggerRate = inputs.triggerRate ?? strategy.defaults.triggerRate;

  if (strategy.protectionType.includes("Buffer") && typeof buffer === "number") {
    lines.push({ label: "Buffer", value: -buffer });
  }

  if (["performanceCap", "guard", "protectionCap"].includes(strategy.id) && typeof cap === "number") {
    lines.push({ label: "Cap", value: cap });
  }

  if (strategy.id === "guard" && typeof floor === "number") {
    lines.push({ label: "Floor", value: floor });
  }

  if (["precision", "dualPrecision", "protectionTrigger"].includes(strategy.id) && typeof triggerRate === "number") {
    lines.push({ label: "Trigger", value: triggerRate });
  }

  return lines;
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
