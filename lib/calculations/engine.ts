import { computeEndingValue } from "@/lib/calculations/strategies";
import { buildPayoffSeries } from "@/lib/calculations/payoffVisualization";
import { strategyById } from "@/lib/strategyConfigs";
import {
  StrategyComparisonResult,
  StrategyConfig,
  StrategyId,
  StrategyInputs,
  StrategyResult
} from "@/types/strategy";

export function calculateStrategyOutcome(
  config: StrategyConfig,
  marketReturn: number,
  startingPremium: number,
  inputs: StrategyInputs
): StrategyResult {
  const creditedReturn = config.calculate(marketReturn, inputs);
  const endingValue = computeEndingValue(startingPremium, creditedReturn);
  const dollarChange = endingValue - startingPremium;

  return {
    creditedReturn,
    endingValue,
    dollarChange,
    explanation: config.explainer(marketReturn, inputs, creditedReturn)
  };
}

export function buildPayoffData(config: StrategyConfig, inputs: StrategyInputs) {
  return buildPayoffSeries(config, inputs);
}

export function visibleInputKeys(strategyId: StrategyId): Array<keyof StrategyInputs> {
  return strategyById[strategyId].requiredInputs;
}

export function compareStrategyOutcomes(args: {
  strategyA: StrategyConfig;
  strategyB: StrategyConfig;
  inputsA: StrategyInputs;
  inputsB: StrategyInputs;
  marketReturn: number;
  startingPremium: number;
}): StrategyComparisonResult {
  const a = calculateStrategyOutcome(args.strategyA, args.marketReturn, args.startingPremium, args.inputsA);
  const b = calculateStrategyOutcome(args.strategyB, args.marketReturn, args.startingPremium, args.inputsB);

  const creditedDifference = b.creditedReturn - a.creditedReturn;
  const endingValueDifference = b.endingValue - a.endingValue;
  const winner = endingValueDifference === 0 ? "Tie" : endingValueDifference > 0 ? "B" : "A";

  const summary =
    winner === "Tie"
      ? "Both strategies produce the same outcome in this scenario."
      : winner === "B"
        ? `Strategy B preserves $${Math.abs(endingValueDifference).toLocaleString(undefined, { maximumFractionDigits: 2 })} more than Strategy A in this market result.`
        : `Strategy A preserves $${Math.abs(endingValueDifference).toLocaleString(undefined, { maximumFractionDigits: 2 })} more than Strategy B in this market result.`;

  return { a, b, creditedDifference, endingValueDifference, winner, summary };
}
