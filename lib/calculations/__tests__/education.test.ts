import { describe, expect, it } from "vitest";
import { calculateEducationalOutcome, calculateDollarReturn, validateProductTerms } from "../education";
import { educationalProduct, termsFromStrategy } from "../../products";
import { strategyConfigs } from "../../strategyConfigs";
import { RilaProductTerms } from "../../../types/product";
const calc = (r: number, terms = educationalProduct) => calculateEducationalOutcome(terms, r, 100000);
describe("educational outcome engine", () => {
  it.each([
    [0, 0, 100000], [-0.05, 0, 100000], [-0.1, 0, 100000], [-0.1001, -0.0001, 99990],
    [-0.15, -0.05, 95000], [-0.18, -0.08, 92000], [-0.25, -0.15, 85000], [-0.5, -0.4, 60000], [-1, -0.9, 10000],
    [0.08, 0.08, 108000], [0.15, 0.15, 115000], [0.1501, 0.15, 115000], [0.25, 0.15, 115000]
  ])("index %s produces return %s and dollars %s", (r, expected, dollars) => {
    const o = calc(r); expect(o.rilaReturn).toBeCloseTo(expected, 10); expect(o.rilaEndingValue).toBeCloseTo(dollars, 6);
  });
  it("allocates every dollar of a decline without calling trigger gains absorbed loss", () => {
    for (const r of [-0.05, -0.1, -0.1001, -0.18, -0.5, -1]) {
      const o = calc(r); expect(o.absorbedDollars + o.investorLossDollars).toBeCloseTo(-r * 100000, 6);
    }
    const trigger: RilaProductTerms = { ...educationalProduct, upside: { kind: "trigger", rate: 0.08, condition: "withinBuffer" } };
    const o = calc(-0.05, trigger); expect(o.absorbedDollars).toBeCloseTo(5000); expect(o.rilaEndingValue).toBeCloseTo(108000);
  });
  it("applies participation before a cap and preserves gains above 200%", () => {
    const capped: RilaProductTerms = { ...educationalProduct, upside: { kind: "cap", cap: 0.15, participationRate: 1.5 } };
    const o = calc(0.2, capped); expect(o.upsideBeforeCap).toBeCloseTo(0.3); expect(o.capReductionRate).toBeCloseTo(0.15); expect(o.rilaReturn).toBe(0.15);
    const uncapped: RilaProductTerms = { ...educationalProduct, upside: { kind: "participation", participationRate: 6 } };
    const p = calc(0.4, uncapped); expect(p.rilaReturn).toBeCloseTo(2.4); expect(p.rilaEndingValue).toBeCloseTo(340000);
    expect(p.explanation).not.toMatch(/cap/);
  });
  it("distinguishes a floor from a buffer", () => {
    const floor: RilaProductTerms = { ...educationalProduct, protection: { kind: "floor", rate: -0.1 } };
    expect(calc(-0.05, floor).rilaReturn).toBe(-0.05); expect(calc(-0.5, floor).rilaReturn).toBe(-0.1);
    expect(calc(-0.05).rilaReturn).toBe(0); expect(calc(-0.5).rilaReturn).toBe(-0.4);
  });
  it("keeps term outcomes cumulative rather than silently annualizing", () => {
    expect(calc(0.08, { ...educationalProduct, creditingPeriodMonths: 72 }).rilaEndingValue).toBe(108000);
  });
  it.each([NaN, Infinity, -1])("rejects invalid investments %s", v => expect(() => calculateDollarReturn(v, 0.08)).toThrow(RangeError));
  it("rejects invalid terms and returns before producing results", () => {
    expect(() => calc(-1.01)).toThrow(RangeError);
    expect(() => calc(0.08, { ...educationalProduct, protection: { kind: "buffer", rate: -0.1 } })).toThrow(RangeError);
    expect(() => calc(0.08, { ...educationalProduct, upside: { kind: "cap", cap: -0.1, participationRate: 1 } })).toThrow(RangeError);
    expect(() => calc(0.08, { ...educationalProduct, upside: { kind: "participation", participationRate: NaN } })).toThrow(RangeError);
    expect(() => validateProductTerms({ ...educationalProduct, creditingPeriodMonths: 0 })).toThrow(RangeError);
  });
  it("uses boundary wording that agrees with the numbers", () => {
    expect(calc(0).explanation).toContain("flat"); expect(calc(0.15).explanation).toContain("exactly at the cap");
    expect(calc(-0.1001).explanation).toContain("10.01%"); expect(calc(-0.1001).explanation).toContain("0.01% loss");
  });
  it("adapts every legacy strategy without changing valid payoff results", () => {
    for (const strategy of strategyConfigs) for (const r of [-0.5, -0.1001, -0.1, -0.05, 0, 0.08, 0.12, 0.5]) {
      expect(calc(r, termsFromStrategy(strategy, strategy.defaults)).rilaReturn).toBeCloseTo(strategy.calculate(r, strategy.defaults), 10);
    }
  });
});
