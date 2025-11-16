import type { Metadata } from "next";
import { Provider } from "./provider";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";

// Disabled Google Fonts due to build issues
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Sui Swap Assistant",
  description: "AI-powered swap intent builder for Sui blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
