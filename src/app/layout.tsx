import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";

import { Providers } from "./providers";

import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin-ext"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const displayFont = Outfit({
  subsets: ["latin-ext"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Friends Together",
  description: "Cinematic minimal social feed redesign for Friends Together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
