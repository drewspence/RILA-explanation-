"use client";
import { RilaProductTerms } from "@/types/product";
import { NumberField } from "./NumberField";
export function AdvisorSettings({
  terms,
  onChange,
  investment,
  setInvestment,
}: {
  terms: RilaProductTerms;
  onChange: (terms: RilaProductTerms) => void;
  investment: number;
  setInvestment: (v: number) => void;
}) {
  const protection = terms.protection;
  const upside = terms.upside;
  return (
    <section
      className="settings-panel"
      id="advisor-settings"
      aria-label="Advisor settings"
    >
      <div className="settings-heading">
        <h2>Set the hypothetical terms</h2>
        <p>
          Changing the term changes the timeframe, not the return formula. Caps
          and returns shown are for the whole term.
        </p>
      </div>
      <div className="settings-grid">
        <NumberField
          label="Starting investment"
          value={investment}
          onChange={setInvestment}
          min={0}
          max={1000000000}
          step={0.01}
          suffix="USD"
        />
        <label className="select-field">
          Downside rule
          <select
            value={protection.kind}
            onChange={(e) =>
              onChange({
                ...terms,
                protection:
                  e.target.value === "buffer"
                    ? { kind: "buffer", rate: 0.1 }
                    : { kind: "floor", rate: -0.1 },
                upside:
                  upside.kind === "trigger"
                    ? { ...upside, condition: "nonNegative" }
                    : upside,
              })
            }
          >
            <option value="buffer">Buffer · absorbs first losses</option>
            <option value="floor">Floor · limits index-linked loss</option>
          </select>
        </label>
        {protection.kind === "buffer" && (
          <NumberField
            label="Buffer"
            value={protection.rate * 100}
            onChange={(v) =>
              onChange({
                ...terms,
                protection: { kind: "buffer", rate: v / 100 },
              })
            }
            min={0}
            max={100}
          />
        )}
        {protection.kind === "floor" && (
          <NumberField
            label="Maximum index-linked loss"
            value={-protection.rate * 100}
            onChange={(v) =>
              onChange({
                ...terms,
                protection: { kind: "floor", rate: -v / 100 },
              })
            }
            min={0}
            max={100}
          />
        )}
        <label className="select-field">
          Upside rule
          <select
            value={upside.kind}
            onChange={(e) =>
              onChange({
                ...terms,
                upside:
                  e.target.value === "cap"
                    ? { kind: "cap", cap: 0.15, participationRate: 1 }
                    : e.target.value === "participation"
                      ? { kind: "participation", participationRate: 1 }
                      : {
                          kind: "trigger",
                          rate: 0.08,
                          condition: "nonNegative",
                        },
              })
            }
          >
            <option value="cap">Cap + participation</option>
            <option value="participation">Participation · no cap</option>
            <option value="trigger">Fixed trigger credit</option>
          </select>
        </label>
        {upside.kind === "cap" && (
          <NumberField
            label="Upside cap"
            value={upside.cap * 100}
            onChange={(v) =>
              onChange({ ...terms, upside: { ...upside, cap: v / 100 } })
            }
            min={0}
            max={200}
          />
        )}
        {upside.kind !== "trigger" && (
          <NumberField
            label="Participation rate"
            value={upside.participationRate * 100}
            onChange={(v) =>
              onChange({
                ...terms,
                upside: { ...upside, participationRate: v / 100 },
              })
            }
            min={0}
            max={1000}
          />
        )}
        {upside.kind === "trigger" && (
          <>
            <NumberField
              label="Trigger credit"
              value={upside.rate * 100}
              onChange={(v) =>
                onChange({ ...terms, upside: { ...upside, rate: v / 100 } })
              }
              min={0}
              max={100}
            />
            <label className="select-field">
              Trigger condition
              <select
                value={upside.condition}
                onChange={(e) =>
                  onChange({
                    ...terms,
                    upside: {
                      ...upside,
                      condition: e.target.value as
                        | "nonNegative"
                        | "withinBuffer",
                    },
                  })
                }
              >
                <option value="nonNegative">
                  Index finishes flat or positive
                </option>
                {protection.kind === "buffer" && (
                  <option value="withinBuffer">
                    Index finishes at or above buffer boundary
                  </option>
                )}
              </select>
            </label>
          </>
        )}
        <NumberField
          label="Crediting period"
          value={terms.creditingPeriodMonths / 12}
          onChange={(v) =>
            onChange({ ...terms, creditingPeriodMonths: v * 12 })
          }
          min={1}
          max={10}
          step={1}
          suffix="years"
        />
      </div>
      {protection.kind === "buffer" && (
        <div className="buffer-presets">
          <span>Try a buffer</span>
          {[10, 15, 20, 30].map((b) => (
            <button
              key={b}
              aria-pressed={protection.rate === b / 100}
              onClick={() =>
                onChange({
                  ...terms,
                  protection: { kind: "buffer", rate: b / 100 },
                })
              }
            >
              {b}%
            </button>
          ))}
        </div>
      )}
      <p className="settings-note">
        These are adjustable educational assumptions, not a quote or available
        carrier offer. No specific index product is selected. Index options and
        contract terms can be loaded through the product model when verified
        specifications are available.
      </p>
    </section>
  );
}
