import { describe, expect, it } from "vitest";
import { buildChartDomain, buildClientFriendlyScenarios, buildPayoffSeries, buildPayoffChartMeta } from "../payoffVisualization";
import { strategyById } from "../../strategyConfigs";

const pointAt = (series: Array<{ market: number; credited: number }>, market: number) =>
  series.find((p) => p.market === market)?.credited;

describe("payoff visualization helpers", () => {
  it("builds a continuous payoff series from -50% to +50%", () => {
    const series = buildPayoffSeries(strategyById.performanceCap, { buffer: 0.1, cap: 0.12 });
    expect(series.length).toBe(101);
    expect(series[0]?.market).toBe(-0.5);
    expect(series[100]?.market).toBe(0.5);
  });

  it("captures piecewise breakpoints for capped strategy", () => {
    const series = buildPayoffSeries(strategyById.performanceCap, { buffer: 0.1, cap: 0.12 });
    expect(pointAt(series, -0.1)).toBeCloseTo(0, 6);
    expect(pointAt(series, -0.11)).toBeCloseTo(-0.01, 6);
    expect(pointAt(series, 0.12)).toBeCloseTo(0.12, 6);
    expect(pointAt(series, 0.2)).toBeCloseTo(0.12, 6);
  });

  it("creates strategy-specific visual annotations with short labels", () => {
    const meta = buildPayoffChartMeta("precision", { buffer: 0.1, triggerRate: 0.09 });
    expect(meta.zones.some((z) => z.label.includes("buffer"))).toBe(true);
    expect(meta.lines.some((l) => l.kind === "trigger")).toBe(true);
    expect(meta.notes.some((n) => n.includes("Trigger"))).toBe(true);
  });


  it("builds simple buffer and cap bar examples from the strategy calculation logic", () => {
    const scenarios = buildClientFriendlyScenarios(strategyById.performanceCap, { buffer: 0.1, cap: 0.12 });

    expect(scenarios).toHaveLength(3);
    expect(scenarios[0]).toMatchObject({
      title: "Market down within buffer",
      market: -0.1,
      credited: 0,
      note: "Loss absorbed by buffer"
    });
    expect(scenarios[1]).toMatchObject({
      title: "Market down beyond buffer",
      market: -0.25,
      note: "Client only participates after buffer is exceeded"
    });
    expect(scenarios[1]?.credited).toBeCloseTo(strategyById.performanceCap.calculate(-0.25, { buffer: 0.1, cap: 0.12 }), 6);
    expect(scenarios[1]?.credited).toBeCloseTo(-0.15, 6);
    expect(scenarios[2]).toMatchObject({
      title: "Market positive but capped",
      market: 0.18,
      note: "Growth limited at cap"
    });
    expect(scenarios[2]?.credited).toBeCloseTo(strategyById.performanceCap.calculate(0.18, { buffer: 0.1, cap: 0.12 }), 6);
    expect(scenarios[2]?.credited).toBeCloseTo(0.12, 6);
  });

  it("updates the simple buffer scenarios when selected inputs change", () => {
    const scenarios = buildClientFriendlyScenarios(strategyById.performanceCap, { buffer: 0.2, cap: 0.09 });

    expect(scenarios[0]?.market).toBeCloseTo(-0.1, 6);
    expect(scenarios[0]?.credited).toBeCloseTo(0, 6);
    expect(scenarios[1]?.market).toBeCloseTo(-0.35, 6);
    expect(scenarios[1]?.credited).toBeCloseTo(-0.15, 6);
    expect(scenarios[2]?.market).toBeCloseTo(0.15, 6);
    expect(scenarios[2]?.credited).toBeCloseTo(0.09, 6);
    expect(scenarios[2]?.referenceLine).toEqual({ label: "Cap", value: 0.09 });
  });

  it("builds safe chart domains without NaN", () => {
    const series = buildPayoffSeries(strategyById.dualPrecision, { buffer: 0.2, triggerRate: 0.09 });
    const domain = buildChartDomain(series, [0.06, 0.09, -0.2]);
    expect(Number.isNaN(domain.x[0])).toBe(false);
    expect(Number.isNaN(domain.y[1])).toBe(false);
    expect(domain.x[0]).toBeLessThan(domain.x[1]);
    expect(domain.y[0]).toBeLessThan(domain.y[1]);
  });
});
