import { Card } from "@/components/shared/Card";
import { strategyConfigs } from "@/lib/strategyConfigs";

export function StrategyEducationCards() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {strategyConfigs.map((strategy) => (
        <Card key={strategy.id} className="border border-slate-200">
          <h4 className="text-lg font-semibold">{strategy.label}</h4>
          <p className="mt-2 text-sm text-slate-600">{strategy.description}</p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <strong>Strongest when:</strong> {strategy.strongestWhen}
            </li>
            <li>
              <strong>Tradeoff:</strong> {strategy.tradeoff}
            </li>
            <li>
              <strong>Formula:</strong> {strategy.formulaSummary}
            </li>
          </ul>
        </Card>
      ))}
    </div>
  );
}
