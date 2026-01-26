import type { Metadata } from "next";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polymarket Trading Bot",
  description: "Automated trading bot for Polymarket with real-time monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
