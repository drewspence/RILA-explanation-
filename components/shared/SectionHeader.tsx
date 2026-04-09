export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}
