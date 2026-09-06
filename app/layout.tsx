import type { Metadata } from "next";
import "./globals.css";
import "./arc-interactions.css";
import "./range-views.css";
import "./range-interactions.css";
import "./arc-visual-language.css";
import "./onboarding-screen.css";

export const metadata: Metadata = {
  title: "Arc | Wax & Wing",
  description: "A teacher planning workspace from Wax & Wing."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
