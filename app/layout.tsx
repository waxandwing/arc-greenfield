import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "./arc-interactions.css";
import "./range-views.css";
import "./range-interactions.css";
import "./arc-visual-language.css";
import "./onboarding-screen.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Arc | Wax & Wing",
  description: "A teacher planning workspace from Wax & Wing."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
