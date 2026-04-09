import { ReactNode } from "react";
import clsx from "clsx";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx("rounded-2xl bg-white p-6 shadow-premium", className)}>{children}</section>;
}
