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
  protectionType: string;
}

export function HeroOutcomeCard({
  strategyName,
  marketReturn,
  creditedReturn,
  endingValue,
  dollarChange,
  explanation,
  roundToDollar,
  protectionType
}: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="overflow-hidden border-slate-300 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Live scenario outcome</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold lg:text-3xl">{strategyName}</h2>
          <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs text-slate-100">{protectionType}</span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Metric label="Market Return" value={pct(marketReturn)} />
          <Metric label="Credited Return" value={pct(creditedReturn)} />
          <Metric label="Gain / Loss" value={currency(dollarChange, roundToDollar)} positive={dollarChange >= 0} />
          <Metric label="Ending Value" value={currency(endingValue, roundToDollar)} />
          <Metric label="Protection" value={protectionType} compact />
        </div>

        <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200">{explanation}</p>
      </Card>
    </motion.div>
  );
}

function Metric({ label, value, positive, compact = false }: { label: string; value: string; positive?: boolean; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 font-semibold ${compact ? "text-base" : "text-xl"} ${positive === undefined ? "text-white" : positive ? "text-emerald-300" : "text-rose-300"}`}>{value}</p>
    </div>
  );
}
