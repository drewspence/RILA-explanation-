import { EducationalOutcome, RilaProductTerms } from "@/types/product";
import { currency, pct } from "@/lib/formatters";
import { ReturnComparisonChart } from "@/components/charts/ReturnComparisonChart";
export function BufferVisual({
  outcome: o,
  terms,
}: {
  outcome: EducationalOutcome;
  terms: RilaProductTerms;
}) {
  const down = o.indexReturn < 0;
  const up = o.indexReturn > 0;
  return (
    <section
      className="buffer-visual"
      data-testid="payoff-chart"
      aria-label="Visual return breakdown"
    >
      <div className="visual-heading">
        <div>
          <p className="eyebrow">
            {down
              ? terms.protection.kind === "buffer"
                ? "The buffer at work"
                : "The downside rule"
              : "The upside tradeoff"}
          </p>
          <h2>Index vs. RILA return</h2>
          <p>Move the slider to compare both returns.</p>
        </div>
        <span className="term-badge">
          End of {terms.creditingPeriodMonths / 12}-year term
        </span>
      </div>
      <ReturnComparisonChart outcome={o} terms={terms} />
      <div className="breakdown-grid">
        {down ? (
          <>
            <div className="breakdown absorbed-key">
              <span className="key-label">
                {terms.protection.kind === "buffer"
                  ? "Absorbed by buffer"
                  : "Index loss absorbed"}
              </span>
              <strong data-testid="absorbed-rate">{pct(o.absorbedRate)}</strong>
              <span data-testid="absorbed-dollars">
                {currency(o.absorbedDollars, true)}
              </span>
            </div>
            <div
              className={`breakdown ${o.investorLossRate > 0 ? "loss-key" : "neutral-key"}`}
            >
              <span className="key-label">Your loss</span>
              <strong data-testid="investor-loss-rate">
                {pct(o.investorLossRate)}
              </strong>
              <span data-testid="investor-loss-dollars">
                {currency(o.investorLossDollars, true)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="breakdown gain-key">
              <span className="key-label">Your credited return</span>
              <strong>{pct(o.rilaReturn)}</strong>
              <span>{currency(Math.max(0, o.rilaDollarChange), true)}</span>
            </div>
            <div className="breakdown cap-key">
              <span className="key-label">
                {terms.upside.kind === "cap"
                  ? "Above cap · not credited"
                  : terms.upside.kind === "participation"
                    ? "Participation adjustment"
                    : "Fixed trigger"}
              </span>
              <strong>
                {terms.upside.kind === "cap"
                  ? pct(o.capReductionRate)
                  : terms.upside.kind === "participation"
                    ? pct(o.participationAdjustmentRate)
                    : pct(terms.upside.rate)}
              </strong>
              <span>
                {terms.upside.kind === "cap"
                  ? currency(o.capReductionDollars, true)
                  : terms.upside.kind === "participation"
                    ? `${pct(terms.upside.participationRate)} of index gains`
                    : "When the trigger condition is met"}
              </span>
            </div>
          </>
        )}
      </div>
      {up &&
        terms.upside.kind === "cap" &&
        terms.upside.participationRate !== 1 && (
          <p className="threshold-caption">
            Participation first: {pct(o.indexReturn)} ×{" "}
            {pct(terms.upside.participationRate)} = {pct(o.upsideBeforeCap)}.
            Then apply the {pct(terms.upside.cap)} cap.
          </p>
        )}
      <p className="live-explanation" data-testid="live-scenario-explanation">
        {o.explanation}
      </p>
    </section>
  );
}
