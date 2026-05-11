import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "1-year RILA strategy illustration",
  description: "Educational, advisor-facing illustration tool for one-year indexed strategies."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
