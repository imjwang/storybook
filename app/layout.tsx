"use client"

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Web3Providers } from "./providers/web3";
// import PrivyProviderWrapper from "./providers/privyprovider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <PrivyProviderWrapper> */}
        <Web3Providers>
          {children}
        </Web3Providers>
        {/* </PrivyProviderWrapper> */}
      </body>
    </html >
  );
}
