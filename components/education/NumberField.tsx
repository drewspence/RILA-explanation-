"use client";
import { useEffect, useId, useState } from "react";
/** Retain invalid edits without committing them to the financial model. */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  suffix = "%",
  testId,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  testId?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState("");
  useEffect(() => {
    setDraft(String(value));
    setError("");
  }, [value]);
  return (
    <div className="number-field">
      <label htmlFor={id}>{label}</label>
      <div className={`number-input ${error ? "invalid" : ""}`}>
        <input
          id={id}
          data-testid={testId}
          type="number"
          inputMode="decimal"
          value={draft}
          min={min}
          max={max}
          step={step}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            const text = e.target.value;
            setDraft(text);
            const next = Number(text);
            if (
              text === "" ||
              !Number.isFinite(next) ||
              next < min ||
              next > max ||
              (step === 1 && !Number.isInteger(next))
            ) {
              setError(
                `Enter ${step === 1 ? "a whole number" : "a value"} from ${min} to ${max}. The last valid value is still shown in the results.`,
              );
              return;
            }
            setError("");
            onChange(next);
          }}
        />
        {suffix && <span>{suffix}</span>}
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
