import { describe, expect, it } from "vitest";
import { buildPayoffSeries, buildPayoffChartMeta, getScenarioPoint } from "../payoffVisualization";
import { strategyById } from "../../strategyConfigs";

const pointAt = (series: Array<{ market: number; credited: number }>, market: number) =>
  series.find((p) => p.market === market)?.credited;

describe("payoff visualization helpers", () => {
  it("builds a continuous payoff series from -50% to +50%", () => {
    const series = buildPayoffSeries(strategyById.performanceCap, { buffer: 0.1, cap: 0.12 }, false, 0.01);
    expect(series.length).toBe(101);
    expect(series[0]?.market).toBe(-0.5);
    expect(series[100]?.market).toBe(0.5);
  });

  it("captures piecewise breakpoints for capped strategy", () => {
    const series = buildPayoffSeries(strategyById.performanceCap, { buffer: 0.1, cap: 0.12 }, false, 0);
    expect(pointAt(series, -0.1)).toBeCloseTo(0, 6);
    expect(pointAt(series, -0.11)).toBeCloseTo(-0.01, 6);
    expect(pointAt(series, 0.12)).toBeCloseTo(0.12, 6);
    expect(pointAt(series, 0.2)).toBeCloseTo(0.12, 6);
  });

  it("returns the exact scenario point from live assumptions", () => {
    const point = getScenarioPoint(strategyById.performanceParticipation, { buffer: 0.1, participationRate: 1.2 }, 0.037, false, 0, 100000);
    expect(point.market).toBeCloseTo(0.037, 6);
    expect(point.credited).toBeCloseTo(0.0444, 6);
    expect(point.endingValue).toBeCloseTo(104440, 2);
  });

  it("creates strategy-specific visual annotations", () => {
    const meta = buildPayoffChartMeta("precision", { buffer: 0.1, triggerRate: 0.09 });
    expect(meta.zones.some((z) => z.kind === "buffer")).toBe(true);
    expect(meta.lines.some((l) => l.kind === "trigger")).toBe(true);
    expect(meta.notes.some((n) => n.includes("trigger"))).toBe(true);
  });
});
