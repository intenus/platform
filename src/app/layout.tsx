import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "@/app/provider";

export const metadata: Metadata = {
  title: "Intenus Protocol - Intent-based DeFi on Sui",
  description: "Natural language DeFi aggregation with MEV protection and optimal routing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
