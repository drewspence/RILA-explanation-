/** All rates are decimal fractions; term returns are cumulative, never annualized. */
export type ProtectionRule =
  | { kind: "buffer"; rate: number }
  | { kind: "floor"; rate: number }
  | { kind: "indexProtection" };
export type UpsideRule =
  | { kind: "cap"; cap: number; participationRate: number }
  | { kind: "participation"; participationRate: number }
  | {
      kind: "trigger";
      rate: number;
      condition: "nonNegative" | "withinBuffer";
    };
export interface RilaProductTerms {
  id: string;
  label: string;
  carrier?: string;
  productName?: string;
  index: { id: string; label: string; returnBasis: "price" };
  creditingPeriodMonths: number;
  protection: ProtectionRule;
  upside: UpsideRule;
  /** Descriptive only. This educational engine does not price fees or interim withdrawals. */
  contract?: {
    feesDescription?: string;
    surrenderDescription?: string;
    prospectusUrl?: string;
    effectiveDate?: string;
  };
  source: "hypothetical" | "contract";
}
export interface EducationalOutcome {
  indexReturn: number;
  rilaReturn: number;
  indexEndingValue: number;
  rilaEndingValue: number;
  indexDollarChange: number;
  rilaDollarChange: number;
  absorbedRate: number;
  absorbedDollars: number;
  investorLossRate: number;
  investorLossDollars: number;
  upsideBeforeCap: number;
  capReductionRate: number;
  capReductionDollars: number;
  participationAdjustmentRate: number;
  explanation: string;
}
