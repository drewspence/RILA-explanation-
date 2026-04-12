interface FieldProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export function Field({ label, value, onChange, min, max, step = 0.1, suffix = "%" }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <div className="flex items-center rounded-xl border border-slate-200 px-3 py-2">
        <input
          type="number"
          inputMode="decimal"
          value={Number.isNaN(value) ? 0 : value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-full bg-transparent text-base text-slate-900 focus:outline-none"
        />
        {suffix && <span className="text-slate-500">{suffix}</span>}
      </div>
    </label>
  );
}
