import { ScenarioPreset } from "@/types/strategy";

export const scenarioPresets: ScenarioPreset[] = [
  { label: "Strong Up +20%", value: 0.2 },
  { label: "Moderate Up +8%", value: 0.08 },
  { label: "Flat 0%", value: 0 },
  { label: "Mild Down -6%", value: -0.06 },
  { label: "Moderate Down -12%", value: -0.12 },
  { label: "Severe Down -25%", value: -0.25 }
];
