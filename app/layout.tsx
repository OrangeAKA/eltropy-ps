import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Public Sans is the typeface of the US Web Design System. It carries that
// federal, deliberate, considered weight that maps naturally onto a credit
// union context (federally regulated, conservative). Not on the Impeccable
// banned-fonts reflex list, which is the point.
const publicSans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Source Serif 4 carries the brand wordmark and top-level page titles. A
// sober slab-y serif on the masthead immediately separates this from every
// other teal-on-white SaaS workspace. Trade publication feel, not dashboard.
const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

// Geist Mono on IDs, amounts, durations, audit-log timing. Slightly more
// character than JetBrains Mono without being weird.
const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eltropy Mission Control — Demo",
  description:
    "Agentic AI orchestration platform for credit unions. Mission Control + Agent Exchange prototype.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${sourceSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-page text-neutral-900 font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
