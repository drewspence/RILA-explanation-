import { pct, currency } from "@/lib/formatters";
import {
  EducationalOutcome,
  RilaProductTerms,
  ProtectionRule,
  UpsideRule,
} from "@/types/product";

function range(
  label: string,
  value: number,
  min: number,
  max = Number.MAX_VALUE,
) {
  if (!Number.isFinite(value) || value < min || value > max)
    throw new RangeError(`${label} must be between ${min} and ${max}.`);
}
export function validateProductTerms(terms: RilaProductTerms) {
  range("Crediting period in months", terms.creditingPeriodMonths, 1, 120);
  if (!Number.isInteger(terms.creditingPeriodMonths))
    throw new RangeError("Crediting period must use whole months.");
  if (terms.index.returnBasis !== "price")
    throw new RangeError("Only price returns are modeled.");
  if (terms.protection.kind === "buffer")
    range("Buffer", terms.protection.rate, 0, 1);
  if (terms.protection.kind === "floor")
    range("Floor", terms.protection.rate, -1, 0);
  if (terms.upside.kind === "cap") {
    range("Cap", terms.upside.cap, 0);
    range("Participation", terms.upside.participationRate, 0);
  }
  if (terms.upside.kind === "participation")
    range("Participation", terms.upside.participationRate, 0);
  if (terms.upside.kind === "trigger") {
    range("Trigger", terms.upside.rate, 0);
    if (
      terms.upside.condition === "withinBuffer" &&
      terms.protection.kind !== "buffer"
    )
      throw new RangeError("A within-buffer trigger requires a buffer.");
  }
}
export function calculateBufferReturn(indexReturn: number, buffer: number) {
  range("Index return", indexReturn, -1);
  range("Buffer", buffer, 0, 1);
  return indexReturn < 0 ? Math.min(0, indexReturn + buffer) : indexReturn;
}
export function calculateParticipation(
  indexReturn: number,
  participationRate: number,
) {
  range("Participation", participationRate, 0);
  range("Index return", indexReturn, 0);
  const result = indexReturn * participationRate;
  if (!Number.isFinite(result))
    throw new RangeError("Participation result is too large.");
  return result;
}
export function calculateCap(returnBeforeCap: number, cap: number) {
  range("Return before cap", returnBeforeCap, 0);
  range("Cap", cap, 0);
  return Math.min(returnBeforeCap, cap);
}
export function calculateDollarReturn(investment: number, returnRate: number) {
  range("Starting investment", investment, 0);
  range("Return", returnRate, -1);
  const endingValue = investment * (1 + returnRate);
  if (!Number.isFinite(endingValue))
    throw new RangeError("Dollar result is too large.");
  return { endingValue, dollarChange: endingValue - investment };
}
function downside(r: number, protection: ProtectionRule) {
  if (protection.kind === "buffer")
    return calculateBufferReturn(r, protection.rate);
  if (protection.kind === "floor") return Math.max(r, protection.rate);
  return 0;
}
function upside(r: number, rule: UpsideRule) {
  if (rule.kind === "trigger") return rule.rate;
  const participated = calculateParticipation(r, rule.participationRate);
  return rule.kind === "cap"
    ? calculateCap(participated, rule.cap)
    : participated;
}
/** Point-to-point, end-of-term illustration. No fee, tax, dividend or withdrawal modeling. */
export function calculateEducationalOutcome(
  terms: RilaProductTerms,
  indexReturn: number,
  investment: number,
): EducationalOutcome {
  validateProductTerms(terms);
  range("Index return", indexReturn, -1);
  let rilaReturn =
    indexReturn < 0
      ? downside(indexReturn, terms.protection)
      : upside(indexReturn, terms.upside);
  if (
    terms.upside.kind === "trigger" &&
    terms.upside.condition === "withinBuffer" &&
    terms.protection.kind === "buffer" &&
    indexReturn >= -terms.protection.rate
  )
    rilaReturn = terms.upside.rate;
  // Normalize floating point residue for display and exact zero boundaries.
  rilaReturn = Math.round(rilaReturn * 1e12) / 1e12;
  const index = calculateDollarReturn(investment, indexReturn);
  const rila = calculateDollarReturn(investment, rilaReturn);
  const marketLoss = Math.max(0, -indexReturn);
  const investorLossRate = Math.max(0, -rilaReturn);
  // Absorption excludes any trigger credit earned in a negative index scenario.
  const absorbedRate = Math.max(0, marketLoss - investorLossRate);
  const upsideBeforeCap =
    indexReturn >= 0 && terms.upside.kind !== "trigger"
      ? calculateParticipation(indexReturn, terms.upside.participationRate)
      : Math.max(0, indexReturn);
  const capReductionRate =
    terms.upside.kind === "cap" && indexReturn > 0
      ? Math.max(0, upsideBeforeCap - rilaReturn)
      : 0;
  const participationAdjustmentRate =
    indexReturn > 0 && terms.upside.kind !== "trigger"
      ? upsideBeforeCap - indexReturn
      : 0;
  const result: EducationalOutcome = {
    indexReturn,
    rilaReturn,
    indexEndingValue: index.endingValue,
    rilaEndingValue: rila.endingValue,
    indexDollarChange: index.dollarChange,
    rilaDollarChange: rila.dollarChange,
    absorbedRate,
    absorbedDollars: investment * absorbedRate,
    investorLossRate,
    investorLossDollars: investment * investorLossRate,
    upsideBeforeCap,
    capReductionRate,
    capReductionDollars: investment * capReductionRate,
    participationAdjustmentRate,
    explanation: "",
  };
  result.explanation = explainOutcome(terms, result);
  return result;
}
export function explainOutcome(terms: RilaProductTerms, o: EducationalOutcome) {
  const r = o.indexReturn;
  if (r < 0 && terms.protection.kind === "buffer") {
    const trigger =
      o.rilaReturn > 0
        ? ` This trigger rule also credits ${pct(o.rilaReturn)}.`
        : "";
    return o.investorLossRate > 0
      ? `The index is down ${pct(-r)}. Your ${pct(terms.protection.rate)} buffer absorbs the first ${pct(o.absorbedRate)}, leaving you with a ${pct(o.investorLossRate)} loss.`
      : `The index is down ${pct(-r)}. The decline stays within your ${pct(terms.protection.rate)} buffer, so none of this index loss reaches you.${trigger}`;
  }
  if (r < 0 && terms.protection.kind === "floor")
    return `The index is down ${pct(-r)}. Your loss is ${pct(o.investorLossRate)}; this floor limits the end-of-term index-linked loss to ${pct(-terms.protection.rate)}.`;
  if (r < 0)
    return `The index is down ${pct(-r)}. This hypothetical rule credits 0% from the index. Fees and early withdrawals can still reduce account value.`;
  if (terms.upside.kind === "trigger")
    return `The index ${r === 0 ? "finished flat" : `gained ${pct(r)}`}. This trigger rule credits a fixed ${pct(o.rilaReturn)}.`;
  if (r === 0)
    return "The index finished flat. There is no index gain or loss to credit.";
  if (terms.upside.kind === "cap" && o.capReductionRate > 0)
    return `The index gained ${pct(r)}.${terms.upside.participationRate !== 1 ? ` At ${pct(terms.upside.participationRate)} participation, that becomes ${pct(o.upsideBeforeCap)} before the cap.` : ""} The ${pct(terms.upside.cap)} cap limits your credited return to ${pct(o.rilaReturn)}.`;
  if (terms.upside.participationRate !== 1)
    return `The index gained ${pct(r)}. At ${pct(terms.upside.participationRate)} participation, your credited return is ${pct(o.rilaReturn)}.`;
  return `The index gained ${pct(r)}. Your credited return is ${pct(o.rilaReturn)}${terms.upside.kind === "cap" && r === terms.upside.cap ? ", exactly at the cap" : ""}.`;
}
export function outcomeAccessibleSummary(o: EducationalOutcome) {
  return `Index return ${pct(o.indexReturn)}. RILA return ${pct(o.rilaReturn)}. Ending value ${currency(o.rilaEndingValue)}. Absorbed loss ${currency(o.absorbedDollars)}. Your loss ${currency(o.investorLossDollars)}.`;
}
