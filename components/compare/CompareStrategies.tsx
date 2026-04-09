"use client";

import { useState } from "react";
import { Card } from "@/components/shared/Card";
import { calculateStrategyOutcome } from "@/lib/calculations/engine";
import { currency, pct } from "@/lib/formatters";
import { strategyConfigs } from "@/lib/strategyConfigs";
import { GlobalInputs, StrategyInputs } from "@/types/strategy";

export function CompareStrategies({
  globalInputs,
  inputMap
}: {
  globalInputs: GlobalInputs;
  inputMap: Record<string, StrategyInputs>;
}) {
  const [tableView, setTableView] = useState(false);

  const rows = strategyConfigs.map((s) => {
    const result = calculateStrategyOutcome(
      s,
      globalInputs.marketReturn,
      globalInputs.startingPremium,
      globalInputs.feeEnabled,
      globalInputs.annualFee,
      inputMap[s.id] || s.defaults,
      globalInputs.showNetOfFee
    );
    return { s, result, inputs: inputMap[s.id] || s.defaults };
  });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Compare Strategies</h3>
        <button onClick={() => setTableView((v) => !v)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
          {tableView ? "Card View" : "Table View"}
        </button>
      </div>
      {tableView ? (
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th>Strategy</th><th>Market</th><th>Cap/Trigger/Participation</th><th>Buffer/Floor</th><th>Credited</th><th>Ending Value</th><th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, result, inputs }) => (
                <tr key={s.id} className="border-b align-top">
                  <td className="py-2 font-medium">{s.label}</td>
                  <td>{pct(globalInputs.marketReturn)}</td>
                  <td>{inputs.cap ? `Cap ${pct(inputs.cap)}` : ""} {inputs.triggerRate ? `Trigger ${pct(inputs.triggerRate)}` : ""} {inputs.participationRate ? `Part ${pct(inputs.participationRate)}` : ""}</td>
                  <td>{inputs.buffer ? `Buffer ${pct(inputs.buffer)}` : ""} {inputs.floor ? `Floor ${pct(inputs.floor)}` : ""}</td>
                  <td>{pct(result.creditedReturnNet)}</td>
                  <td>{currency(result.endingValue, globalInputs.roundToDollar)}</td>
                  <td className="max-w-xs">{result.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ s, result }) => (
            <div key={s.id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">{s.protectionType}</p>
              <h4 className="text-base font-semibold">{s.label}</h4>
              <p className="mt-2 text-2xl font-bold text-advisorBlue">{pct(result.creditedReturnNet)}</p>
              <p className="text-sm text-slate-600">Ending {currency(result.endingValue, globalInputs.roundToDollar)}</p>
              <p className="mt-2 text-xs text-slate-600">{result.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
