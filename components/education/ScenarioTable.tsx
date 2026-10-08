"use client";
import { RilaProductTerms } from "@/types/product";
import { calculateEducationalOutcome } from "@/lib/calculations/education";
import { pct, currency } from "@/lib/formatters";
const examples = [0.25, 0.15, 0.08, 0, -0.05, -0.1, -0.15, -0.25, -0.4, -0.5];
export function ScenarioTable({
  terms,
  investment,
  selected,
  onSelect,
}: {
  terms: RilaProductTerms;
  investment: number;
  selected: number;
  onSelect: (r: number) => void;
}) {
  return (
    <section className="scenario-section">
      <p className="eyebrow">Stress test</p>
      <h2>What happens if…</h2>
      <p className="section-description">
        Try a bigger decline. Select a row to see it above.
      </p>
      <div className="scenario-table-wrap">
        <table className="scenario-table">
          <caption className="sr-only">
            Hypothetical returns over the selected term using the current
            settings
          </caption>
          <thead>
            <tr>
              <th scope="col">Index return</th>
              <th scope="col">RILA return</th>
              <th scope="col">RILA ending value</th>
              <th scope="col">Your loss</th>
            </tr>
          </thead>
          <tbody>
            {examples.map((r) => {
              const o = calculateEducationalOutcome(terms, r, investment);
              return (
                <tr
                  key={r}
                  className={Math.abs(r - selected) < 1e-8 ? "selected" : ""}
                >
                  <th scope="row">
                    <button
                      aria-pressed={Math.abs(r - selected) < 1e-8}
                      onClick={() => onSelect(r)}
                      aria-label={`Show index ${pct(r)} scenario`}
                    >
                      {r > 0 ? "+" : ""}
                      {pct(r)} <span aria-hidden="true">↗</span>
                    </button>
                  </th>
                  <td className={o.rilaReturn < 0 ? "loss-text" : ""}>
                    {o.rilaReturn > 0 ? "+" : ""}
                    {pct(o.rilaReturn)}
                  </td>
                  <td>{currency(o.rilaEndingValue, true)}</td>
                  <td>{currency(o.investorLossDollars, true)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
