import { Card } from "@/components/shared/Card";
import { StrategyResult } from "@/types/strategy";
import { currency, pct } from "@/lib/formatters";

export function PresentationView({
  strategy,
  clientName,
  marketReturn,
  result,
  assumptions,
  comparisonSummary
}: {
  strategy: string;
  clientName: string;
  marketReturn: number;
  result: StrategyResult;
  assumptions: string[];
  comparisonSummary?: string;
}) {
  return (
    <Card className="print:rounded-none print:border-none print:shadow-none">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Advisor presentation view</p>
      <h3 className="mt-1 text-3xl font-semibold text-slate-900">Client Illustration Summary</h3>
      <p className="mt-2 text-sm text-slate-600">Client: <strong>{clientName || "Client Name"}</strong></p>
      <p className="text-sm text-slate-600">Strategy: <strong>{strategy}</strong></p>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <Stat label="Market return" value={pct(marketReturn)} />
        <Stat label="Credited return" value={pct(result.creditedReturn)} />
        <Stat label="Dollar gain / loss" value={currency(result.dollarChange)} />
        <Stat label="Ending value" value={currency(result.endingValue)} />
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assumptions</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {assumptions.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      {comparisonSummary && <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">{comparisonSummary}</p>}
      <p className="mt-4 text-xs text-slate-500">For client discussion only. This summary is not a contract or performance guarantee.</p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
