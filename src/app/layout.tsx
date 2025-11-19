import type { Metadata } from "next";
import { Provider } from "@/app/provider";
// import { Poppins } from "next/font/google";
import '@mysten/dapp-kit/dist/index.css';

// const poppins = Poppins({
//   weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
// });

export const metadata: Metadata = {
  title: "Intenus Protocol",
  description:
    "Natural language DeFi aggregation with MEV protection and optimal routing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
