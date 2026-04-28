import { StrategyId, StrategyInputs, StrategyResult } from "@/types/strategy";
import { currency, pct } from "@/lib/formatters";

export function PresentationView({
  strategy,
  strategyId,
  clientName,
  setClientName,
  marketReturn,
  result,
  assumptions,
  payoffData,
  inputs
}: {
  strategy: string;
  strategyId: StrategyId;
  clientName: string;
  setClientName: (name: string) => void;
  marketReturn: number;
  result: StrategyResult;
  assumptions: string[];
  payoffData: Array<{ market: number; credited: number }>;
  inputs: StrategyInputs;
}) {
  const points = payoffData;

  return (
    <section className="space-y-4 print:space-y-2">
      <div className="no-print rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client name (optional)</label>
        <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" className="mt-2 w-full rounded-xl border border-slate-300 p-2 text-sm" />
      </div>

      <article className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-sm print:rounded-none print:border-none print:shadow-none">
        <header className="border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Client Illustration</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">{strategy}</h2>
          <p className="mt-1 text-sm text-slate-600">Prepared for: <strong>{clientName || "Client"}</strong></p>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat label="Market Scenario" value={pct(marketReturn)} />
          <Stat label="Credited Return" value={pct(result.creditedReturn)} />
          <Stat label="Ending Value" value={currency(result.endingValue)} />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Payoff visual</p>
            <svg viewBox="0 0 420 210" className="h-56 w-full">
              <rect x={0} y={0} width={420} height={210} fill="#f8fafc" rx={8} />
              <line x1={30} y1={105} x2={390} y2={105} stroke="#94a3b8" strokeDasharray="5 5" />
              <line x1={210} y1={24} x2={210} y2={186} stroke="#94a3b8" strokeDasharray="5 5" />
              <path d={toPath(points)} stroke="#0f172a" strokeWidth={4} fill="none" />
              <circle cx={toX(marketReturn)} cy={toY(result.creditedReturn)} r={5} fill="#0f172a" stroke="#fff" strokeWidth={2} />
              <text x={36} y={28} fill="#475569" fontSize="10">{strategyId} payoff profile</text>
              <text x={36} y={194} fill="#475569" fontSize="10">Active scenario: {pct(marketReturn)} / {pct(result.creditedReturn)}</text>
            </svg>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assumptions</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {assumptions.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600">
              <p>Buffer: {inputs.buffer ? pct(inputs.buffer) : "N/A"}</p>
              <p>Cap: {inputs.cap ? pct(inputs.cap) : "N/A"}</p>
              <p>Trigger: {inputs.triggerRate ? pct(inputs.triggerRate) : "N/A"}</p>
              <p>Floor: {inputs.floor ? pct(inputs.floor) : "N/A"}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-900">How this works</h3>
          <p className="mt-2 text-sm text-slate-700">This strategy links returns to index behavior with defined downside rules and upside tradeoffs. In this scenario, a market move of {pct(marketReturn)} leads to a credited return of {pct(result.creditedReturn)}, producing an estimated ending value of {currency(result.endingValue)} before fees and riders.</p>
        </section>

        <footer className="mt-5 border-t border-slate-200 pt-3 text-xs text-slate-500">For discussion purposes only. Not a contract. Rates, caps, participation, spreads, and rider charges vary by carrier and issue date.</footer>
      </article>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function toX(value: number) {
  return 30 + ((value + 0.5) / 1.0) * 360;
}

function toY(value: number) {
  return 186 - ((value + 0.5) / 1.0) * 162;
}

function toPath(points: Array<{ market: number; credited: number }>) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.market)},${toY(p.credited)}`).join(" ");
}
