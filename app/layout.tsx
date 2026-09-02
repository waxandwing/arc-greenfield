import type { Metadata } from "next";
import "./globals.css";
import "./onboarding-screen.css";
import "./workspace-rebuild-v2.css";

export const metadata: Metadata = {
  title: "Arc by Wax & Wing",
  description: "A teacher-first planning desk for plans that change"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
