import type { Metadata } from "next";
import "./globals.css";
import "./arc-interactions.css";
import "./range-views.css";
import "./range-interactions.css";
import "./arc-visual-language.css";
import "./onboarding-screen.css";
import "./week-planner.css";
import "./weekend-week.css";
import "./reconciled-shell.css";

export const metadata: Metadata = {
  title: "Arc",
  description: "Arc by Wax & Wing"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
