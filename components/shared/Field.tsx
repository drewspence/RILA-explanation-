import clsx from "clsx";

interface FieldProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  theme?: "light" | "dark";
}

export function Field({ label, value, onChange, min, max, step = 0.1, suffix = "%", theme = "light" }: FieldProps) {
  return (
    <label className={clsx("mb-3 flex flex-col gap-2 text-sm font-medium", theme === "dark" ? "text-slate-100" : "text-slate-700")}>
      {label}
      <div className={clsx("flex items-center rounded-xl border px-3 py-2", theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
        <input
          type="number"
          inputMode="decimal"
          value={Number.isNaN(value) ? 0 : value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className={clsx("w-full bg-transparent text-base focus:outline-none", theme === "dark" ? "text-white" : "text-slate-900")}
        />
        {suffix && <span className={theme === "dark" ? "text-slate-400" : "text-slate-500"}>{suffix}</span>}
      </div>
    </label>
  );
}
