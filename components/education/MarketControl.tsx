"use client";
import { NumberField } from "./NumberField";
import { pct } from "@/lib/formatters";
const scenarios = [0.25, 0.1, 0, -0.05, -0.1, -0.2, -0.35];
export function MarketControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <section className="market-control" aria-label="Choose an index return">
      <div className="market-top">
        <div>
          <label htmlFor="market-return" className="eyebrow">
            Move the market
          </label>
          <p className="control-hint">What if the index finishes here?</p>
        </div>
        <NumberField
          label="Index return"
          value={Math.round(value * 10000) / 100}
          onChange={(v) => onChange(v / 100)}
          min={-50}
          max={50}
          testId="market-number"
        />
      </div>
      <input
        id="market-return"
        data-testid="market-slider"
        aria-label="Index return slider"
        aria-valuetext={`${pct(value)} cumulative index price return over the selected term`}
        type="range"
        min={-0.5}
        max={0.5}
        step={0.0001}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="slider-ticks" aria-hidden="true">
        <span>−50% decline</span>
        <span>0%</span>
        <span>+50% growth</span>
      </div>
      <div className="scenario-buttons" data-testid="scenario-presets">
        {scenarios.map((v) => (
          <button
            key={v}
            aria-pressed={Math.abs(v - value) < 1e-8}
            onClick={() => onChange(v)}
          >
            {v > 0 ? "+" : ""}
            {pct(v)}
          </button>
        ))}
      </div>
    </section>
  );
}
