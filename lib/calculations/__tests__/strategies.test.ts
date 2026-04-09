import { describe, expect, it } from "vitest";
import {
  dualPrecision,
  guard,
  performanceWithCap,
  precision,
  protectionCap,
  protectionTrigger,
  applyFee,
  computeEndingValue
} from "../strategies";

const close = (n: number, target: number) => expect(n).toBeCloseTo(target, 6);

describe("strategy calculations", () => {
  it("1) Performance +18% => +12%", () => close(performanceWithCap(0.18, { buffer: 0.1, cap: 0.12 }), 0.12));
  it("2) Performance -7% => 0%", () => close(performanceWithCap(-0.07, { buffer: 0.1 }), 0));
  it("3) Performance -18% => -8%", () => close(performanceWithCap(-0.18, { buffer: 0.1 }), -0.08));

  it("4) Precision +2% => +10%", () => close(precision(0.02, { triggerRate: 0.1, buffer: 0.1 }), 0.1));
  it("5) Precision -6% => 0%", () => close(precision(-0.06, { buffer: 0.1 }), 0));
  it("6) Precision -14% => -4%", () => close(precision(-0.14, { buffer: 0.1 }), -0.04));

  it("7) Dual Precision +5% => +8%", () => close(dualPrecision(0.05, { buffer: 0.1, triggerRate: 0.08 }), 0.08));
  it("8) Dual Precision -6% => +8%", () => close(dualPrecision(-0.06, { buffer: 0.1, triggerRate: 0.08 }), 0.08));
  it("9) Dual Precision -14% => -4%", () => close(dualPrecision(-0.14, { buffer: 0.1 }), -0.04));

  it("10) Guard +20% => +12%", () => close(guard(0.2, { cap: 0.12, floor: -0.1 }), 0.12));
  it("11) Guard -7% => -7%", () => close(guard(-0.07, { cap: 0.12, floor: -0.1 }), -0.07));
  it("12) Guard -22% => -10%", () => close(guard(-0.22, { floor: -0.1 }), -0.1));

  it("13) Protection Trigger +3% => +4%", () => close(protectionTrigger(0.03, { triggerRate: 0.04 }), 0.04));
  it("14) Protection Trigger -12% => 0%", () => close(protectionTrigger(-0.12, {}), 0));

  it("15) Protection Cap +15% => +7%", () => close(protectionCap(0.15, { cap: 0.07 }), 0.07));
  it("16) Protection Cap -20% => 0%", () => close(protectionCap(-0.2, {}), 0));

  it("applies fee and computes ending value", () => {
    const net = applyFee(0.08, true, 0.01);
    close(net, 0.07);
    close(computeEndingValue(100000, net), 107000);
  });
});
