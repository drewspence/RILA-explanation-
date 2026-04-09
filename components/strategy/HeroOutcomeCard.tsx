import { motion } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { currency, pct } from "@/lib/formatters";

interface Props {
  strategyName: string;
  marketReturn: number;
  creditedReturn: number;
  endingValue: number;
  dollarChange: number;
  explanation: string;
  roundToDollar: boolean;
}

export function HeroOutcomeCard({
  strategyName,
  marketReturn,
  creditedReturn,
  endingValue,
  dollarChange,
  explanation,
  roundToDollar
}: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="border border-slate-200 bg-gradient-to-br from-white to-slate-50">
        <p className="text-sm uppercase tracking-wide text-slate-500">Live outcome</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{strategyName}</h1>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Metric label="Hypothetical S&P 500 Return" value={pct(marketReturn)} />
          <Metric label="Credited Return" value={pct(creditedReturn)} />
          <Metric label="Dollar Gain / Loss" value={currency(dollarChange, roundToDollar)} />
          <Metric label="Ending Account Value" value={currency(endingValue, roundToDollar)} />
        </div>
        <p className="mt-4 rounded-xl bg-slate-100 p-3 text-base text-slate-700">{explanation}</p>
      </Card>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
