import { applyFee, computeEndingValue } from "@/lib/calculations/strategies";
import { StrategyConfig, StrategyInputs, StrategyResult } from "@/types/strategy";

export function calculateStrategyOutcome(
  config: StrategyConfig,
  marketReturn: number,
  startingPremium: number,
  feeEnabled: boolean,
  annualFee: number,
  inputs: StrategyInputs,
  showNetOfFee: boolean
): StrategyResult {
  const creditedReturnGross = config.calculate(marketReturn, inputs);
  const creditedReturnNet = applyFee(creditedReturnGross, feeEnabled, annualFee);
  const displayReturn = showNetOfFee ? creditedReturnNet : creditedReturnGross;
  const endingValue = computeEndingValue(startingPremium, creditedReturnNet);
  const dollarChange = endingValue - startingPremium;

  return {
    creditedReturnGross,
    creditedReturnNet: displayReturn,
    endingValue,
    dollarChange,
    explanation: config.explainer(marketReturn, inputs, displayReturn)
  };
}

export function buildPayoffData(config: StrategyConfig, inputs: StrategyInputs, feeEnabled: boolean, annualFee: number) {
  const points = [] as Array<{ market: number; credited: number }>;
  for (let i = -40; i <= 40; i += 1) {
    const market = i / 100;
    const gross = config.calculate(market, inputs);
    const credited = applyFee(gross, feeEnabled, annualFee);
    points.push({ market, credited });
  }
  return points;
}
