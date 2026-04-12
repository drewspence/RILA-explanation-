import clsx from "clsx";

export function SectionHeader({
  title,
  subtitle,
  invert = false
}: {
  title: string;
  subtitle: string;
  invert?: boolean;
}) {
  return (
    <div className="mb-4">
      <h2 className={clsx("text-xl font-semibold tracking-tight lg:text-2xl", invert ? "text-white" : "text-slate-900")}>{title}</h2>
      <p className={clsx("mt-1 text-sm", invert ? "text-slate-300" : "text-slate-600")}>{subtitle}</p>
    </div>
  );
}
