import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arc Greenfield",
  description: "Arc by Wax & Wing — greenfield rebuild"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
