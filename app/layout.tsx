import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "RILA Explained · See the buffer working",
  description:
    "See how RILA buffers absorb index losses, explore the upside tradeoff, and compare hypothetical outcomes over a defined term.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
