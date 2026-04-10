import { describe, expect, it } from "vitest";

import { strategyById } from "../../strategyConfigs";

type StrategyId = keyof typeof strategyById;

type ValidationPoint = {
  marketReturn: number;
  expected: number;
};

type ValidationScenario = {
  defaults: (typeof strategyById)[StrategyId]["defaults"];
  points: ValidationPoint[];
};

const scenarios: Record<StrategyId, ValidationScenario> = {
  performanceCap: {
    defaults: { buffer: 0.1, cap: 0.12, floor: -0.1, triggerRate: 0.09, participationRate: 1 },
    points: [
      { marketReturn: -0.2, expected: -0.1 },
      { marketReturn: -0.1, expected: 0 },
      { marketReturn: 0, expected: 0 },
      { marketReturn: 0.12, expected: 0.12 },
      { marketReturn: 0.3, expected: 0.12 }
    ]
  },
  performanceParticipation: {
    defaults: { buffer: 0.1, cap: 0.12, floor: -0.1, triggerRate: 0.09, participationRate: 1.5 },
    points: [
      { marketReturn: -0.18, expected: -0.08 },
      { marketReturn: -0.1, expected: 0 },
      { marketReturn: 0, expected: 0 },
      { marketReturn: 0.1, expected: 0.15 },
      { marketReturn: 0.2, expected: 0.3 }
    ]
  },
  precision: {
    defaults: { buffer: 0.1, cap: 0.12, floor: -0.1, triggerRate: 0.09, participationRate: 1 },
    points: [
      { marketReturn: -0.15, expected: -0.05 },
      { marketReturn: -0.1, expected: 0 },
      { marketReturn: 0, expected: 0.09 },
      { marketReturn: 0.2, expected: 0.09 }
    ]
  },
  dualPrecision: {
    defaults: { buffer: 0.1, cap: 0.12, floor: -0.1, triggerRate: 0.08, participationRate: 1 },
    points: [
      { marketReturn: -0.14, expected: -0.04 },
      { marketReturn: -0.1, expected: 0.08 },
      { marketReturn: 0, expected: 0.08 },
      { marketReturn: 0.2, expected: 0.08 }
    ]
  },
  guard: {
    defaults: { buffer: 0.1, cap: 0.12, floor: -0.1, triggerRate: 0.09, participationRate: 1 },
    points: [
      { marketReturn: -0.25, expected: -0.1 },
      { marketReturn: -0.1, expected: -0.1 },
      { marketReturn: 0, expected: 0 },
      { marketReturn: 0.12, expected: 0.12 },
      { marketReturn: 0.3, expected: 0.12 }
    ]
  },
  protectionTrigger: {
    defaults: { buffer: 0.1, cap: 0.07, floor: -0.1, triggerRate: 0.04, participationRate: 1 },
    points: [
      { marketReturn: -0.2, expected: 0 },
      { marketReturn: -0.001, expected: 0 },
      { marketReturn: 0, expected: 0.04 },
      { marketReturn: 0.2, expected: 0.04 }
    ]
  },
  protectionCap: {
    defaults: { buffer: 0.1, cap: 0.07, floor: -0.1, triggerRate: 0.04, participationRate: 1 },
    points: [
      { marketReturn: -0.2, expected: 0 },
      { marketReturn: -0.001, expected: 0 },
      { marketReturn: 0, expected: 0 },
      { marketReturn: 0.07, expected: 0.07 },
      { marketReturn: 0.2, expected: 0.07 }
    ]
  }
};

describe("strategy payoff validation matrix", () => {
  for (const [strategyId, scenario] of Object.entries(scenarios) as Array<[StrategyId, ValidationScenario]>) {
    it(`${strategyId} matches expected payoff shape and boundaries`, () => {
      const actual = scenario.points.map((point) => strategyById[strategyId].calculate(point.marketReturn, scenario.defaults));
      const expected = scenario.points.map((point) => point.expected);

      actual.forEach((value, index) => {
        expect(value).toBeCloseTo(expected[index], 10);
      });

      const monotonic = actual.every((value, index) => index === 0 || value >= actual[index - 1]);
      expect(monotonic).toBe(true);
    });
  }
});
