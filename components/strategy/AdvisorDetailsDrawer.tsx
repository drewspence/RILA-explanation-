"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { StrategyConfig, StrategyInputs } from "@/types/strategy";

export function AdvisorDetailsDrawer({
  strategy,
  inputs,
  feeEnabled,
  annualFee,
  showNetOfFee
}: {
  strategy: StrategyConfig;
  inputs: StrategyInputs;
  feeEnabled: boolean;
  annualFee: number;
  showNetOfFee: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button className="flex w-full items-center justify-between" onClick={() => setOpen((v) => !v)}>
        <h3 className="text-lg font-semibold">Advisor Details</h3>
        <ChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p>
            <strong>Formula:</strong> {strategy.formulaSummary}
          </p>
          <p>
            <strong>Inputs:</strong> {JSON.stringify(inputs)}
          </p>
          <p>
            <strong>Fee treatment:</strong> {feeEnabled ? `Enabled (${(annualFee * 100).toFixed(2)}%).` : "Off."} {showNetOfFee ? "Displaying net return." : "Displaying gross return."}
          </p>
          <p>
            <strong>Implementation notes:</strong> Educational illustration only; editable assumptions.
          </p>
        </div>
      )}
    </Card>
  );
}
