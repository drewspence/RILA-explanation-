import assert from "node:assert/strict";

import { strategyById } from "../lib/strategyConfigs";

interface Case {
  marketReturn: number;
  expected: number;
  message: string;
}

const EPSILON = 1e-9;

const closeTo = (actual: number, expected: number, message: string) => {
  assert.ok(
    Math.abs(actual - expected) <= EPSILON,
    `${message}: expected ${expected}, received ${actual}`
  );
};

const scenarios = {
  performanceCap: {
    defaults: { buffer: 0.1, cap: 0.12, floor: -0.1, triggerRate: 0.09, participationRate: 1 },
    cases: [
      { marketReturn: -0.1, expected: 0, message: "buffer boundary should absorb losses" },
      { marketReturn: -0.2, expected: -0.1, message: "losses beyond buffer should participate 1:1" },
      { marketReturn: 0.12, expected: 0.12, message: "cap boundary should credit cap" },
      { marketReturn: 0.3, expected: 0.12, message: "upside should flatten at cap" }
    ]
  },
  performanceParticipation: {
    defaults: { buffer: 0.1, cap: 0.12, floor: -0.1, triggerRate: 0.09, participationRate: 1.5 },
    cases: [
      { marketReturn: -0.1, expected: 0, message: "buffer boundary should absorb losses" },
      { marketReturn: -0.18, expected: -0.08, message: "losses beyond buffer should participate 1:1" },
      { marketReturn: 0.1, expected: 0.15, message: "upside should scale with participation" }
    ]
  },
  precision: {
    defaults: { buffer: 0.1, cap: 0.12, floor: -0.1, triggerRate: 0.09, participationRate: 1 },
    cases: [
      { marketReturn: 0, expected: 0.09, message: "non-negative returns should receive trigger" },
      { marketReturn: -0.1, expected: 0, message: "lower buffer boundary should be zero" },
      { marketReturn: -0.15, expected: -0.05, message: "losses beyond buffer should participate 1:1" }
    ]
  },
  dualPrecision: {
    defaults: { buffer: 0.1, cap: 0.12, floor: -0.1, triggerRate: 0.08, participationRate: 1 },
    cases: [
      { marketReturn: 0.2, expected: 0.08, message: "upside should stay fixed at trigger" },
      { marketReturn: -0.1, expected: 0.08, message: "buffer boundary should still receive trigger" },
      { marketReturn: -0.14, expected: -0.04, message: "losses beyond buffer should participate 1:1" }
    ]
  },
  guard: {
    defaults: { buffer: 0.1, cap: 0.12, floor: -0.1, triggerRate: 0.09, participationRate: 1 },
    cases: [
      { marketReturn: -0.1, expected: -0.1, message: "floor boundary should apply" },
      { marketReturn: -0.25, expected: -0.1, message: "downside should flatten at floor" },
      { marketReturn: 0.2, expected: 0.12, message: "upside should flatten at cap" }
    ]
  },
  protectionTrigger: {
    defaults: { buffer: 0.1, cap: 0.07, floor: -0.1, triggerRate: 0.04, participationRate: 1 },
    cases: [
      { marketReturn: 0, expected: 0.04, message: "non-negative returns should receive trigger" },
      { marketReturn: -0.001, expected: 0, message: "negative returns should credit zero" }
    ]
  },
  protectionCap: {
    defaults: { buffer: 0.1, cap: 0.07, floor: -0.1, triggerRate: 0.04, participationRate: 1 },
    cases: [
      { marketReturn: 0.07, expected: 0.07, message: "cap boundary should credit cap" },
      { marketReturn: 0.2, expected: 0.07, message: "upside should flatten at cap" },
      { marketReturn: -0.001, expected: 0, message: "negative returns should credit zero" }
    ]
  }
} as const satisfies Record<keyof typeof strategyById, { defaults: NonNullable<Parameters<(typeof strategyById)[keyof typeof strategyById]["calculate"]>[1]>; cases: readonly Case[] }>;

for (const [strategyId, { defaults, cases }] of Object.entries(scenarios) as Array<
  [keyof typeof strategyById, (typeof scenarios)[keyof typeof scenarios]]
>) {
  const config = strategyById[strategyId];

  for (const testCase of cases) {
    const actual = config.calculate(testCase.marketReturn, defaults);
    closeTo(actual, testCase.expected, `${strategyId}: ${testCase.message}`);
  }

  const sortedPoints = [...cases].sort((a, b) => a.marketReturn - b.marketReturn);
  let previous = Number.NEGATIVE_INFINITY;
  for (const point of sortedPoints) {
    const current = config.calculate(point.marketReturn, defaults);
    assert.ok(current + EPSILON >= previous, `${strategyId}: payoff should be non-decreasing`);
    previous = current;
  }
}

console.log("Strategy validation passed for all payoff shape and boundary checks.");
