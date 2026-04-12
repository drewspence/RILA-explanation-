import { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
  tone = "default"
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "dark";
}) {
  return (
    <section
      className={clsx(
        "rounded-3xl border p-5 shadow-premium lg:p-6",
        tone === "dark" ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white",
        className
      )}
    >
      {children}
    </section>
  );
}
