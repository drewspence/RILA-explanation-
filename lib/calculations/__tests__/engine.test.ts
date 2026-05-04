import { describe, expect, it } from "vitest";
import { compareStrategyOutcomes, visibleInputKeys } from "../engine";
import { strategyById } from "../../strategyConfigs";

describe("engine helpers", () => {
  it("supports head-to-head comparison with same market return and independent assumptions", () => {
    const comparison = compareStrategyOutcomes({
      strategyA: strategyById.performanceCap,
      strategyB: strategyById.dualPrecision,
      inputsA: { buffer: 0.1, cap: 0.12 },
      inputsB: { buffer: 0.2, triggerRate: 0.09 },
      marketReturn: -0.12,
      startingPremium: 100000
    });

    expect(comparison.a.creditedReturn).toBeCloseTo(-0.02, 6);
    expect(comparison.b.creditedReturn).toBeCloseTo(0.09, 6);
    expect(comparison.b.endingValue).toBeGreaterThan(comparison.a.endingValue);
  });

  it("returns only relevant inputs for each strategy", () => {
    expect(visibleInputKeys("performanceCap")).toEqual(["buffer", "cap"]);
    expect(visibleInputKeys("performanceParticipation")).toEqual(["buffer", "participationRate"]);
    expect(visibleInputKeys("precision")).toEqual(["buffer", "triggerRate"]);
    expect(visibleInputKeys("dualPrecision")).toEqual(["buffer", "triggerRate"]);
    expect(visibleInputKeys("guard")).toEqual(["cap", "floor"]);
    expect(visibleInputKeys("protectionCap")).toEqual(["cap"]);
    expect(visibleInputKeys("protectionTrigger")).toEqual(["triggerRate"]);
  });

  it("keeps active scenario values aligned with the same payoff function", () => {
    const strategy = strategyById.performanceCap;
    const inputs = { buffer: 0.1, cap: 0.12 };
    const payoff = [
      -0.4, -0.25, -0.12, -0.1, -0.06, 0, 0.08, 0.12, 0.2, 0.4
    ].map((marketReturn) => ({
      marketReturn,
      outcome: compareStrategyOutcomes({
        strategyA: strategy,
        strategyB: strategy,
        inputsA: inputs,
        inputsB: inputs,
        marketReturn,
        startingPremium: 100000
      }).a.creditedReturn
    }));

    payoff.forEach(({ marketReturn, outcome }) => {
      expect(outcome).toBeCloseTo(strategy.calculate(marketReturn, inputs), 10);
    });
  });

});
