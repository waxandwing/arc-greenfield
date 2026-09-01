import type { Metadata } from "next";
import "./globals.css";
import "./onboarding-screen.css";
import "./workspace-rebuild-v2.css";
import { ArcColorSchemePicker } from "./arc-color-scheme-picker";

export const metadata: Metadata = {
  title: "Arc by Wax & Wing",
  description: "A teacher-first planning desk for plans that change"
};

const arcAssetPalette = `:root{--arc-paper:#F6F1E7;--arc-card:#FFFDF8;--arc-deep:#174F64;--arc-teal:#6F9EAA;--arc-blue:#AAC7D0;--arc-gold:#EFBE3F;--arc-yellow:#F0D538;--arc-coral:#DF8968;--arc-orange:#EFAA57;--arc-q1:#F0D538;--arc-q2:#EFAA57;--arc-q3:#AAC7D0;--arc-q4:#DF8968}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <style>{arcAssetPalette}</style>
        {children}
        <ArcColorSchemePicker />
      </body>
    </html>
  );
}
