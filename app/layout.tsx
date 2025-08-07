import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outside Reversal Checker",
  description: "Live S&P 500 15m outside reversal notifications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

