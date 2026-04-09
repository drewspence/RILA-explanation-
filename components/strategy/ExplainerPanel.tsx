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
    <Card>
      <h3 className="text-xl font-semibold">How this result is built</h3>
      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <Line label="Market move" value={pct(marketReturn)} />
        {strategy.protectionType.includes("Buffer") && marketReturn < 0 && (
          <>
            <Line label="Buffer absorbed" value={pct(Math.min(Math.abs(marketReturn), buffer))} />
            <Line label="Remaining downside applied" value={pct(overBuffer)} />
          </>
        )}
        {strategy.id === "guard" && marketReturn < floor && <Line label="Floor applied" value={pct(floor)} />}
        <Line label="Final credited return" value={pct(creditedReturn)} highlight />
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-advisorBlue" style={{ width: `${Math.min(100, Math.max(0, (creditedReturn + 0.4) * 125))}%` }} />
      </div>
    </Card>
  );
}

function Line({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <strong className={highlight ? "text-advisorBlue" : "text-slate-900"}>{value}</strong>
    </div>
  );
}
