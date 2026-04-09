export type StrategyId =
  | "performanceCap"
  | "performanceParticipation"
  | "precision"
  | "dualPrecision"
  | "guard"
  | "protectionTrigger"
  | "protectionCap";

export interface GlobalInputs {
  startingPremium: number;
  marketReturn: number;
  feeEnabled: boolean;
  annualFee: number;
  showNetOfFee: boolean;
  roundToDollar: boolean;
}

export interface StrategyInputs {
  buffer?: number;
  floor?: number;
  cap?: number;
  triggerRate?: number;
  participationRate?: number;
  labelOverride?: string;
}

export interface StrategyResult {
  creditedReturnGross: number;
  creditedReturnNet: number;
  endingValue: number;
  dollarChange: number;
  explanation: string;
}

export interface StrategyConfig {
  id: StrategyId;
  label: string;
  category: string;
  protectionType: string;
  defaults: Required<Omit<StrategyInputs, "labelOverride">>;
  requiredInputs: Array<keyof StrategyInputs>;
  description: string;
  strongestWhen: string;
  tradeoff: string;
  formulaSummary: string;
  calculate: (marketReturn: number, inputs: StrategyInputs) => number;
  explainer: (marketReturn: number, inputs: StrategyInputs, credited: number) => string;
}

export interface ScenarioPreset {
  label: string;
  value: number;
}
