import { describe, expect, it } from "vitest";
import { decimalToUiPercent, pct, uiPercentToDecimal } from "@/lib/formatters";

describe("formatters", () => {
  it("converts UI percent input to decimal", () => {
    expect(uiPercentToDecimal(10)).toBeCloseTo(0.1, 10);
    expect(uiPercentToDecimal(12)).toBeCloseTo(0.12, 10);
    expect(uiPercentToDecimal(150)).toBeCloseTo(1.5, 10);
  });

  it("converts internal decimals to UI percentages", () => {
    expect(decimalToUiPercent(0.1)).toBe(10);
    expect(decimalToUiPercent(-0.1)).toBe(-10);
    expect(decimalToUiPercent(1)).toBe(100);
  });

  it("formats percentages without floating point artifacts", () => {
    expect(pct(0.0700000000000001)).toBe("7%");
    expect(pct(0.1234, 2)).toBe("12.34%");
  });
});
