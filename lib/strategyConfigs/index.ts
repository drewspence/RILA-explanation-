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

const downText = (r: number) => `The market was down ${pct(Math.abs(r))}.`;

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
        ? `The market was up ${pct(r)}, but this strategy credits up to the ${(i.cap ?? 0.12) * 100}% cap.`
        : Math.abs(r) <= (i.buffer ?? 0.1)
          ? `${downText(r)} It stayed within the ${(i.buffer ?? 0.1) * 100}% buffer, so index loss did not reduce value.`
          : `${downText(r)} After the ${(i.buffer ?? 0.1) * 100}% buffer, the remaining loss impacts the contract.`
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
    tradeoff: "Potentially less upside than full index; severe losses can pass through after buffer.",
    formulaSummary: "Up: r × participation. Down: 0 inside buffer, else r + buffer.",
    calculate: performanceWithParticipation,
    explainer: (r, i) =>
      r >= 0
        ? `The market was up ${pct(r)}, and this strategy credits ${(i.participationRate ?? 1) * 100}% participation.`
        : Math.abs(r) <= (i.buffer ?? 0.1)
          ? `${downText(r)} It stayed within the buffer, so credited return is 0%.`
          : `${downText(r)} Loss beyond the buffer reduces contract value.`
  },
  {
    id: "precision",
    label: "Index Precision",
    category: "Index Precision Strategy",
    protectionType: "Buffer + Trigger",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.12, triggerRate: 0.09, participationRate: 1 },
    requiredInputs: ["buffer", "triggerRate"],
    description: "Predetermined trigger credit in flat or up years, with buffer on the downside.",
    strongestWhen: "Flat-to-moderate up markets and small declines.",
    tradeoff: "No positive credit in modest negative years (inside buffer).",
    formulaSummary: "Up: trigger. Between 0 and -buffer: 0. Below -buffer: r + buffer.",
    calculate: precision,
    explainer: (r, i) =>
      r >= 0
        ? `The market was non-negative, so this Precision design credits the ${(i.triggerRate ?? 0.09) * 100}% trigger.`
        : r >= -(i.buffer ?? 0.1)
          ? `${downText(r)} It stayed within the buffer, so credited return is 0% for Precision.`
          : `${downText(r)} Loss exceeded the buffer, so only the excess loss applies.`
  },
  {
    id: "dualPrecision",
    label: "Index Dual Precision",
    category: "Index Dual Precision Strategy",
    protectionType: "Buffer + Trigger",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.12, triggerRate: 0.08, participationRate: 1 },
    requiredInputs: ["buffer", "triggerRate"],
    description: "Can still credit a positive trigger when market is flat, up, or modestly down within buffer.",
    strongestWhen: "Flat or mildly down markets that stay within the buffer.",
    tradeoff: "Losses beyond the buffer pass through after buffer amount.",
    formulaSummary: "At/above -buffer: trigger. Below -buffer: r + buffer.",
    calculate: dualPrecision,
    explainer: (r, i) =>
      r >= -(i.buffer ?? 0.1)
        ? `The market was ${r < 0 ? "down" : "up"} ${pct(Math.abs(r))}, and Dual Precision still credits ${(i.triggerRate ?? 0.08) * 100}% because the decline stayed within buffer.`
        : `${downText(r)} Decline breached buffer, so remaining loss applies after the buffer.`
  },
  {
    id: "guard",
    label: "Index Guard",
    category: "Index Guard Strategy",
    protectionType: "Floor",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.12, triggerRate: 0.09, participationRate: 1 },
    requiredInputs: ["cap", "floor"],
    description: "Upside capped and downside limited by a floor.",
    strongestWhen: "Volatile markets where hard downside limit is valuable.",
    tradeoff: "No buffer structure; downside can be negative down to floor.",
    formulaSummary: "Up: min(r, cap). Down: max(r, floor).",
    calculate: guard,
    explainer: (r, i) =>
      r >= 0
        ? `The market rose ${pct(r)}, but Guard credits up to the ${(i.cap ?? 0.12) * 100}% cap.`
        : r < (i.floor ?? -0.1)
          ? `${downText(r)} The floor limits downside to ${pct(i.floor ?? -0.1)}.`
          : `${downText(r)} Result follows the market because floor was not reached.`
  },
  {
    id: "protectionTrigger",
    label: "Index Protection (Trigger)",
    category: "Index Protection Strategy",
    protectionType: "Principal Protection",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.07, triggerRate: 0.04, participationRate: 1 },
    requiredInputs: ["triggerRate"],
    description: "No negative return from index decline, with fixed positive trigger in non-negative years.",
    strongestWhen: "Conservative clients prioritizing no index-linked loss.",
    tradeoff: "Limited upside compared with uncapped market exposure.",
    formulaSummary: "Up/non-negative: trigger. Down: 0.",
    calculate: protectionTrigger,
    explainer: (r, i) =>
      r >= 0
        ? `The market was non-negative, so this strategy credits a fixed ${(i.triggerRate ?? 0.04) * 100}% trigger.`
        : `${downText(r)} Protection design credits 0% instead of a negative return.`
  },
  {
    id: "protectionCap",
    label: "Index Protection (Cap)",
    category: "Index Protection Strategy",
    protectionType: "Principal Protection",
    defaults: { buffer: 0.1, floor: -0.1, cap: 0.07, triggerRate: 0.04, participationRate: 1 },
    requiredInputs: ["cap"],
    description: "No negative index-linked return with capped upside participation.",
    strongestWhen: "Conservative stance in uncertain markets.",
    tradeoff: "Upside capped and no leveraged upside capture.",
    formulaSummary: "Up: min(r, cap). Down: 0.",
    calculate: protectionCap,
    explainer: (r, i) =>
      r >= 0
        ? `The market was up ${pct(r)}, and this strategy credits up to the ${(i.cap ?? 0.07) * 100}% cap.`
        : `${downText(r)} Protection design prevents negative index credit (0%).`
  }
];

export const strategyById = Object.fromEntries(strategyConfigs.map((s) => [s.id, s]));
