import { RilaProductTerms } from "@/types/product";
export const educationalProduct: RilaProductTerms = {
  id: "hypothetical-buffer-cap",
  label: "Buffer + capped growth",
  index: {
    id: "hypothetical-price-index",
    label: "Hypothetical index",
    returnBasis: "price",
  },
  creditingPeriodMonths: 12,
  protection: { kind: "buffer", rate: 0.1 },
  upside: { kind: "cap", cap: 0.15, participationRate: 1 },
  source: "hypothetical",
};

import { StrategyConfig, StrategyInputs } from "@/types/strategy";
/** Legacy strategies adapt to explicit rules; unrelated defaults never imply a cap. */
export function termsFromStrategy(
  config: StrategyConfig,
  inputs: StrategyInputs,
): RilaProductTerms {
  const i = { ...config.defaults, ...inputs };
  const protection: RilaProductTerms["protection"] =
    config.requiredInputs.includes("buffer")
      ? { kind: "buffer", rate: i.buffer }
      : config.requiredInputs.includes("floor")
        ? { kind: "floor", rate: i.floor }
        : { kind: "indexProtection" };
  const upside: RilaProductTerms["upside"] = config.requiredInputs.includes(
    "triggerRate",
  )
    ? {
        kind: "trigger",
        rate: i.triggerRate,
        condition:
          config.id === "dualPrecision" ? "withinBuffer" : "nonNegative",
      }
    : config.requiredInputs.includes("participationRate")
      ? { kind: "participation", participationRate: i.participationRate }
      : { kind: "cap", cap: i.cap, participationRate: 1 };
  return {
    ...educationalProduct,
    id: config.id,
    label: config.label,
    protection,
    upside,
  };
}
