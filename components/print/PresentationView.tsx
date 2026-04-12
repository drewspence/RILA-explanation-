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
    <Card className="print:shadow-none">
      <h3 className="text-3xl font-bold">Presentation / Print View</h3>
      <p className="mt-2 text-lg">Client: {clientName || "Client Name"}</p>
      <p className="text-lg">Strategy shown: {strategy}</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
        <p><strong>Market return:</strong> {pct(marketReturn)}</p>
        <p><strong>Credited return:</strong> {pct(result.creditedReturn)}</p>
        <p><strong>Dollar gain/loss:</strong> {currency(result.dollarChange)}</p>
        <p><strong>Ending value:</strong> {currency(result.endingValue)}</p>
      </div>
      <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
        {assumptions.map((item) => <li key={item}>{item}</li>)}
      </ul>
      {comparisonSummary && <p className="mt-3 rounded-lg bg-slate-100 p-3 text-sm">{comparisonSummary}</p>}
      <p className="mt-3 text-sm text-slate-600">Use browser print (Ctrl/Cmd + P) for export-ready output.</p>
    </Card>
  );
}
