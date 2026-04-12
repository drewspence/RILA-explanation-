import { Card } from "@/components/shared/Card";
import { pct } from "@/lib/formatters";
import { StrategyConfig, StrategyInputs } from "@/types/strategy";

interface Props {
  strategy: StrategyConfig;
  marketReturn: number;
  creditedReturn: number;
  inputs: StrategyInputs;
}

export function ExplainerPanel({ strategy, marketReturn, creditedReturn, inputs }: Props) {
  const buffer = inputs.buffer ?? 0;
  const floor = inputs.floor ?? -0.1;
  const overBuffer = Math.max(0, Math.abs(marketReturn) - buffer);

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      <InfoCard
        title="Downside Protection"
        body={
          strategy.protectionType.includes("Buffer")
            ? `First ${pct(buffer)} of losses are absorbed before client value declines.`
            : `Protection follows ${strategy.protectionType.toLowerCase()} terms.`
        }
      />
      <InfoCard
        title="Growth Potential"
        body={inputs.cap ? `Upside growth is credited until the ${pct(inputs.cap)} cap.` : "Upside follows participation or trigger terms for this strategy."}
      />
      <InfoCard title="Current Outcome" body={`Market ${pct(marketReturn)} results in credited return of ${pct(creditedReturn)}.`} />
      <Card className="bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-900">Strategy Tradeoff</h3>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          {strategy.protectionType.includes("Buffer") && marketReturn < 0 && (
            <p>Loss beyond buffer: <strong>{pct(overBuffer)}</strong></p>
          )}
          {strategy.id === "guard" && marketReturn < floor && <p>Floor applied at <strong>{pct(floor)}</strong>.</p>}
          <p>{strategy.tradeoff}</p>
        </div>
      </Card>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="bg-slate-50">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-700">{body}</p>
    </Card>
  );
}
