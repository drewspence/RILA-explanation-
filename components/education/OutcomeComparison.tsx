import { EducationalOutcome } from "@/types/product";
import { currency, pct } from "@/lib/formatters";
export function OutcomeComparison({
  outcome: o,
  investment,
}: {
  outcome: EducationalOutcome;
  investment: number;
}) {
  return (
    <section
      className="outcome-comparison"
      aria-label="Compare index and RILA outcomes"
    >
      <div className="comparison-heading">
        <h2>Same starting point. Different outcome.</h2>
        <span>{currency(investment, true)} invested</span>
      </div>
      <div className="outcome-grid">
        {[
          {
            label: "Index exposure",
            rate: o.indexReturn,
            ending: o.indexEndingValue,
            change: o.indexDollarChange,
            kind: "index",
          },
          {
            label: "RILA strategy",
            rate: o.rilaReturn,
            ending: o.rilaEndingValue,
            change: o.rilaDollarChange,
            kind: "rila",
          },
        ].map((item) => (
          <article key={item.kind} className={`outcome-card ${item.kind}`}>
            <div className="outcome-label">
              <span>{item.label}</span>
              <strong
                className={item.rate < 0 ? "loss-text" : ""}
                data-testid={
                  item.kind === "rila"
                    ? "live-credited-return"
                    : "live-index-return-value"
                }
              >
                {item.rate > 0 ? "+" : ""}
                {pct(item.rate)}
              </strong>
            </div>
            <span className="ending-label">Ending value</span>
            <p
              className={`ending-value ${currency(item.ending, true).length > 10 ? "compact" : ""}`}
              data-testid={
                item.kind === "rila"
                  ? "live-ending-value"
                  : "index-ending-value"
              }
            >
              {currency(item.ending, true)}
            </p>
            <div className="dollar-change">
              <span>
                {item.change < 0 ? "Loss" : item.change > 0 ? "Gain" : "Change"}
              </span>
              <strong>{currency(Math.abs(item.change), true)}</strong>
            </div>
          </article>
        ))}
      </div>
      <p className="comparison-note">
        Index exposure is a hypothetical price-return comparison. Dividends,
        investment costs, taxes, contract fees and withdrawals are not modeled.
      </p>
    </section>
  );
}
