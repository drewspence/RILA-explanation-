import { EducationalOutcome, RilaProductTerms } from "@/types/product";
import { currency, pct } from "@/lib/formatters";
function Track({
  label,
  segments,
  marker,
  scale,
}: {
  scale: number;
  label: string;
  segments: Array<{ rate: number; kind: string }>;
  marker?: number;
}) {
  return (
    <div className="track-row">
      <span className="track-label">{label}</span>
      <div className="spectrum-track" aria-hidden="true">
        {segments.map((s, i) => (
          <span
            key={i}
            className={`spectrum-segment ${s.kind}`}
            data-testid={`segment-${s.kind}`}
            style={{
              width: `${(s.rate / scale) * 100}%`,
              borderWidth: s.rate === 0 ? 0 : undefined,
            }}
          />
        ))}
        {marker !== undefined && marker <= scale && (
          <span
            className="threshold-marker"
            style={{ left: `${(marker / scale) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
export function BufferVisual({
  outcome: o,
  terms,
}: {
  outcome: EducationalOutcome;
  terms: RilaProductTerms;
}) {
  const down = o.indexReturn < 0;
  const scale = Math.max(
    0.5,
    Math.ceil(
      Math.max(
        o.rilaReturn,
        o.upsideBeforeCap,
        o.indexReturn < 0 && terms.protection.kind === "buffer"
          ? terms.protection.rate
          : o.indexReturn >= 0 && terms.upside.kind === "cap"
            ? terms.upside.cap
            : 0,
      ) * 10,
    ) / 10,
  );
  const up = o.indexReturn > 0;
  const limit =
    terms.protection.kind === "buffer" ? terms.protection.rate : undefined;
  const cap = terms.upside.kind === "cap" ? terms.upside.cap : undefined;
  const title = down
    ? "See where the loss goes."
    : up
      ? "See how much growth you keep."
      : "No index move. No index loss.";
  const subtitle = down
    ? "One decline. Two very different outcomes."
    : up
      ? "The upside rule determines what gets credited."
      : "A flat index needs no buffer. Trigger strategies may still credit a return.";
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
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="term-badge">
          End of {terms.creditingPeriodMonths / 12}-year term
        </span>
      </div>
      <div className="visual-tracks">
        <Track
          scale={scale}
          label={down ? "Index decline" : "Index growth"}
          segments={[
            {
              rate: Math.abs(o.indexReturn),
              kind: down ? "market-loss" : "index-growth",
            },
          ]}
        />
        <Track
          scale={scale}
          label={down ? "Loss allocation" : "Growth allocation"}
          marker={down ? limit : cap}
          segments={
            down
              ? [
                  { rate: o.absorbedRate, kind: "absorbed" },
                  { rate: o.investorLossRate, kind: "investor-loss" },
                ]
              : [
                  { rate: Math.max(0, o.rilaReturn), kind: "credited-growth" },
                  { rate: o.capReductionRate, kind: "cap-reduction" },
                ]
          }
        />
        <div className="spectrum-ticks" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i}>{pct((scale * i) / 5)}</span>
          ))}
        </div>
        {down && limit !== undefined && (
          <p className="threshold-caption">
            Dashed line: {pct(limit)} buffer boundary. Loss beyond it reaches
            you.
          </p>
        )}
        {up && cap !== undefined && (
          <p className="threshold-caption">
            Dashed line: {pct(cap)} credited-return cap.
          </p>
        )}
        {down && o.rilaReturn > 0 && (
          <p className="threshold-caption">
            This trigger rule also credits {pct(o.rilaReturn)}; that gain is
            separate from the absorbed decline.
          </p>
        )}
      </div>
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
