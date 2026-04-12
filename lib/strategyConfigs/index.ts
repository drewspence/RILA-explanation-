import {
  dualPrecision,
  guard,
  performanceWithCap,
  performanceWithParticipation,
  precision,
  protectionCap,
  protectionTrigger
} from "@/lib/calculations/strategies";
import { pct } from "@/lib/formatters";
import { StrategyConfig } from "@/types/strategy";

const downText = (r: number) => `The market finished down ${pct(Math.abs(r))}.`;

export const strategyConfigs: StrategyConfig[] = [
  {
    id: "performanceCap",
    label: "Index Performance (Cap)",
    category: "Index Performance Strategy",
    protectionType: "Buffer",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.12, triggerRate: 0.09, participationRate: 1 },
    requiredInputs: ["buffer", "cap"],
    description: "More direct upside with capped growth and downside buffering.",
    strongestWhen: "Mild-to-moderate up markets below the cap, or mild down markets.",
    tradeoff: "Upside capped; large market drops beyond buffer create losses.",
    formulaSummary: "Up: min(r, cap). Down: 0 inside buffer, else r + buffer.",
    calculate: performanceWithCap,
    explainer: (r, i) =>
      r >= 0
        ? r > (i.cap ?? 0.12)
          ? `Because the market rose above the ${pct(i.cap ?? 0.12)} cap, credited return stopped at ${pct(i.cap ?? 0.12)}.`
          : `Because the market rose ${pct(r)}, this strategy credited ${pct(r)} (below the cap).`
        : Math.abs(r) <= (i.buffer ?? 0.1)
          ? `${downText(r)} The decline stayed within the ${pct(i.buffer ?? 0.1)} buffer, so credited return was 0%.`
          : `${downText(r)} After the ${pct(i.buffer ?? 0.1)} buffer, the remaining downside reduced credited return.`
  },
  {
    id: "performanceParticipation",
    label: "Index Performance (Participation)",
    category: "Index Performance Strategy",
    protectionType: "Buffer",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.12, triggerRate: 0.09, participationRate: 1 },
    requiredInputs: ["buffer", "participationRate"],
    description: "Upside is multiplied by a participation rate with downside buffering.",
    strongestWhen: "Steady up markets when participation rate is high.",
    tradeoff: "Severe losses can pass through after the buffer.",
    formulaSummary: "Up: r × participation. Down: 0 inside buffer, else r + buffer.",
    calculate: performanceWithParticipation,
    explainer: (r, i, credited) =>
      r >= 0
        ? `Because the market finished positive, this strategy applied a ${pct(i.participationRate ?? 1, 0)} participation rate and credited ${pct(credited)}.`
        : Math.abs(r) <= (i.buffer ?? 0.1)
          ? `${downText(r)} The decline stayed within the ${pct(i.buffer ?? 0.1)} buffer, so credited return was 0%.`
          : `${downText(r)} Losses beyond the ${pct(i.buffer ?? 0.1)} buffer reduce the credited return.`
  },
  {
    id: "precision",
    label: "Index Precision",
    category: "Index Precision Strategy",
    protectionType: "Buffer + Trigger",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.12, triggerRate: 0.09, participationRate: 1 },
    requiredInputs: ["buffer", "triggerRate"],
    description: "Predetermined trigger credit in flat or up years, with a downside buffer.",
    strongestWhen: "Flat-to-moderate up markets.",
    tradeoff: "No positive credit in negative years that remain inside the buffer.",
    formulaSummary: "Up/flat: trigger. Down inside buffer: 0. Below -buffer: r + buffer.",
    calculate: precision,
    explainer: (r, i) =>
      r >= 0
        ? `Because the market finished at or above 0%, this strategy credited its ${pct(i.triggerRate ?? 0.09)} trigger.`
        : r >= -(i.buffer ?? 0.1)
          ? `${downText(r)} For Index Precision, negative years inside the ${pct(i.buffer ?? 0.1)} buffer credit 0%.`
          : `${downText(r)} Because the decline exceeded the ${pct(i.buffer ?? 0.1)} buffer, only the excess downside was applied.`
  },
  {
    id: "dualPrecision",
    label: "Index Dual Precision",
    category: "Index Dual Precision Strategy",
    protectionType: "Buffer + Trigger",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.12, triggerRate: 0.08, participationRate: 1 },
    requiredInputs: ["buffer", "triggerRate"],
    description: "Can credit a trigger in positive, flat, and modestly negative years within the buffer.",
    strongestWhen: "Flat or mildly down markets that stay within the buffer.",
    tradeoff: "Losses beyond the buffer pass through after the buffer amount.",
    formulaSummary: "At/above -buffer: trigger. Below -buffer: r + buffer.",
    calculate: dualPrecision,
    explainer: (r, i) => {
      if (r > 0) {
        return `Because the market finished positive, this strategy credited its ${pct(i.triggerRate ?? 0.08)} trigger.`;
      }
      if (r >= -(i.buffer ?? 0.1)) {
        return `Because the market declined but stayed within the ${pct(i.buffer ?? 0.1)} buffer, this strategy still credited the ${pct(i.triggerRate ?? 0.08)} trigger.`;
      }
      return `${downText(r)} Because the decline moved beyond the ${pct(i.buffer ?? 0.1)} buffer, remaining downside reduced credited return.`;
    }
  },
  {
    id: "guard",
    label: "Index Guard",
    category: "Index Guard Strategy",
    protectionType: "Floor",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.12, triggerRate: 0.09, participationRate: 1 },
    requiredInputs: ["cap", "floor"],
    description: "Upside capped and downside limited by a floor.",
    strongestWhen: "Volatile markets where a hard downside limit is valuable.",
    tradeoff: "Upside is capped.",
    formulaSummary: "Up: min(r, cap). Down: max(r, floor).",
    calculate: guard,
    explainer: (r, i) =>
      r >= 0
        ? r > (i.cap ?? 0.12)
          ? `Because the market rose above the ${pct(i.cap ?? 0.12)} cap, credited return stopped at ${pct(i.cap ?? 0.12)}.`
          : `Because the market rose ${pct(r)}, credited return matched the market move.`
        : r < (i.floor ?? -0.1)
          ? `${downText(r)} The floor limited downside to ${pct(i.floor ?? -0.1)}.`
          : `${downText(r)} The floor was not reached, so credited return followed the market.`
  },
  {
    id: "protectionTrigger",
    label: "Index Protection (Trigger)",
    category: "Index Protection Strategy",
    protectionType: "Principal Protection",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.07, triggerRate: 0.04, participationRate: 1 },
    requiredInputs: ["triggerRate"],
    description: "100% downside protection from negative index returns with a fixed positive trigger for non-negative years.",
    strongestWhen: "Conservative clients prioritizing no index-linked loss.",
    tradeoff: "Upside is fixed at the trigger.",
    formulaSummary: "Up/non-negative: trigger. Down: 0.",
    calculate: protectionTrigger,
    explainer: (r, i) =>
      r >= 0
        ? `Because the market was flat or positive, this strategy credited its fixed ${pct(i.triggerRate ?? 0.04)} trigger.`
        : `${downText(r)} This protection design credited 0% instead of a negative return.`
  },
  {
    id: "protectionCap",
    label: "Index Protection (Cap)",
    category: "Index Protection Strategy",
    protectionType: "Principal Protection",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.07, triggerRate: 0.04, participationRate: 1 },
    requiredInputs: ["cap"],
    description: "100% downside protection from negative index returns, with upside capped.",
    strongestWhen: "Conservative stance in uncertain markets.",
    tradeoff: "Upside capped in strong positive markets.",
    formulaSummary: "Up: min(r, cap). Down: 0.",
    calculate: protectionCap,
    explainer: (r, i) =>
      r >= 0
        ? r > (i.cap ?? 0.07)
          ? `Because the market rose above the ${pct(i.cap ?? 0.07)} cap, credited return stopped at ${pct(i.cap ?? 0.07)}.`
          : `Because the market rose ${pct(r)}, credited return matched the market move below the cap.`
        : `${downText(r)} This protection design credited 0% instead of a negative return.`
  }
];

export const strategyById = Object.fromEntries(strategyConfigs.map((s) => [s.id, s]));
