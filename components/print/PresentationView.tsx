import { Card } from "@/components/shared/Card";

export function PresentationView({
  strategy,
  clientName
}: {
  strategy: string;
  clientName: string;
}) {
  return (
    <Card className="print:shadow-none">
      <h3 className="text-3xl font-bold">Presentation / Print View</h3>
      <p className="mt-2 text-lg">Client: {clientName || "Client Name"}</p>
      <p className="text-lg">Strategy shown: {strategy}</p>
      <p className="mt-3 text-sm text-slate-600">Use browser print (Ctrl/Cmd + P) for export-ready output.</p>
    </Card>
  );
}
