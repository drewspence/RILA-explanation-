import { Card } from "@/components/shared/Card";
import { strategyConfigs } from "@/lib/strategyConfigs";

export function StrategyEducationCards() {
  return (
    <section>
      <h3 className="mb-3 text-lg font-semibold text-slate-900">Strategy Design Library</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {strategyConfigs.map((strategy) => (
          <Card key={strategy.id} className="border-slate-200 bg-slate-50">
            <h4 className="text-lg font-semibold text-slate-900">{strategy.label}</h4>
            <p className="mt-1 text-sm text-slate-600">{strategy.description}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><strong>Best for:</strong> {strategy.strongestWhen}</li>
              <li><strong>Tradeoff:</strong> {strategy.tradeoff}</li>
              <li><strong>Rule:</strong> {strategy.formulaSummary}</li>
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}
