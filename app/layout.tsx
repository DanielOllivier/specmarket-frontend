import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PositionAlerts } from "@/components/PositionAlerts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpecMarket - On-Chain Collectibles Futures",
  description: "Trade perpetual futures for collectibles on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          {/*  <PositionAlerts /> */}
        </Providers>
      </body>
    </html>
  );
}
