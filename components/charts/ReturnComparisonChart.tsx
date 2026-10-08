"use client";

import { useMemo } from "react";
import { calculateEducationalOutcome } from "@/lib/calculations/education";
import { pct } from "@/lib/formatters";
import { EducationalOutcome, RilaProductTerms } from "@/types/product";

function signedPct(value: number) {
  return `${value > 0 ? "+" : ""}${pct(value)}`;
}

export function ReturnComparisonChart({
  outcome,
  terms,
}: {
  outcome: EducationalOutcome;
  terms: RilaProductTerms;
}) {
  // Keep the scale stable as the slider moves. Include the largest possible
  // return for the current terms so participation strategies cannot clip.
  const scale = useMemo(() => {
    const maximumCredit = calculateEducationalOutcome(terms, 0.5, 1).rilaReturn;
    const triggerCredit = terms.upside.kind === "trigger" ? terms.upside.rate : 0;
    return Math.max(0.5, Math.ceil(Math.max(maximumCredit, triggerCredit) * 10) / 10);
  }, [terms]);
  const position = (rate: number) => 50 - (rate / scale) * 50;
  const magnitude = (rate: number) => (Math.abs(rate) / scale) * 50;
  const boundary =
    terms.protection.kind === "buffer"
      ? -terms.protection.rate
      : terms.protection.kind === "floor"
        ? terms.protection.rate
        : undefined;
  const cap = terms.upside.kind === "cap" ? terms.upside.cap : undefined;
  const negative = outcome.indexReturn < 0;
  const showAbsorbed = negative && outcome.rilaReturn <= 0 && outcome.absorbedRate > 0;
  const values = [
    { label: "Index return", value: outcome.indexReturn, className: "index-column", id: "index" },
    { label: "RILA return", value: outcome.rilaReturn, className: "rila-column", id: "credit" },
  ];

  return (
    <figure className="return-chart" aria-label="Index and RILA vertical bar comparison">
      <div className="return-chart-legend" aria-hidden="true">
        <span><i className="index-swatch" />Index return</span>
        <span><i className={outcome.rilaReturn < 0 ? "loss-swatch" : "credit-swatch"} />RILA return</span>
        {showAbsorbed && <span><i className="absorbed-swatch" />Loss absorbed</span>}
      </div>
      <div className="return-plot" data-testid="return-plot" aria-hidden="true">
        {[-1, -0.5, 0, 0.5, 1].map((factor) => (
          <div key={factor} className={factor === 0 ? "return-gridline zero-gridline" : "return-gridline"} style={{ top: `${position(scale * factor)}%` }}>
            <span className="return-axis-label">{signedPct(scale * factor)}</span>
          </div>
        ))}
        {terms.protection.kind === "buffer" && boundary !== undefined && (
          <div
            className="return-buffer-zone"
            data-testid="buffer-zone"
            style={{ top: "50%", height: `${Math.min(50, magnitude(boundary))}%` }}
          />
        )}
        {boundary !== undefined && Math.abs(boundary) <= scale && (
          <div className="return-rule buffer-rule" data-testid="downside-boundary" style={{ top: `${position(boundary)}%` }}>
            <span>{pct(Math.abs(boundary))} {terms.protection.kind === "buffer" ? "buffer" : "loss floor"}</span>
          </div>
        )}
        {cap !== undefined && cap <= scale && (
          <div className="return-rule cap-rule" data-testid="cap-boundary" style={{ top: `${position(cap)}%` }}>
            <span>{pct(cap)} cap</span>
          </div>
        )}
        <div className="return-columns">
          {values.map(({ label, value, className, id }) => (
            <div className={`return-column ${className}`} key={id}>
              <div
                className={`return-bar ${id === "index" ? "index-bar" : value < 0 ? "loss-bar" : "credit-bar"} ${value < 0 ? "negative-bar" : ""}`}
                data-testid={`live-${id}-bar`}
                data-return={value}
                style={{
                  top: `${value > 0 ? position(value) : 50}%`,
                  height: `${magnitude(value)}%`,
                }}
              />
              {id === "credit" && showAbsorbed && (
                <div
                  className="return-absorbed-gap"
                  data-testid="segment-absorbed"
                  style={{
                    top: `${position(outcome.rilaReturn)}%`,
                    height: `${magnitude(outcome.absorbedRate)}%`,
                  }}
                />
              )}
              <span
                className={`return-value ${value < 0 ? "below-value" : "above-value"} ${id === "index" ? "index-value" : value < 0 ? "loss-value" : "credit-value"}`}
                data-testid={`live-${id}-bar-label`}
                style={{ top: `${Math.min(92, Math.max(8, position(value)))}%` }}
              >
                {signedPct(value)}
              </span>
              <span className="return-column-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="return-chart-caption">
        <span className="sr-only">
          Index return {signedPct(outcome.indexReturn)}. RILA return {signedPct(outcome.rilaReturn)}.
        </span>
        {showAbsorbed
          ? `The shaded extension shows the ${pct(outcome.absorbedRate)} of index loss absorbed. Your RILA loss is ${pct(outcome.investorLossRate)}.`
          : terms.protection.kind === "buffer"
            ? "The buffer line marks an index-loss threshold. Losses beyond it can reach your account."
            : "Both bars use the same scale. The selected contract rules determine your RILA return."}
        {boundary !== undefined && Math.abs(boundary) > scale && (
          <> The {pct(Math.abs(boundary))} {terms.protection.kind === "buffer" ? "buffer" : "floor"} boundary is below this chart’s range.</>
        )}
      </figcaption>
    </figure>
  );
}
