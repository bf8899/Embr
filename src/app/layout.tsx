import type { Metadata } from "next";
import { Syne, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { EmberBackground } from "@/components/ember-background";

const syne = Syne({
  variable: "--font-syne",
  weight: ["500", "700", "800"],
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ember",
  description: "Ember is a new home for video, built on a tip economy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <EmberBackground />
        <div className="app-content flex min-h-full flex-col">{children}</div>
        <AnalyticsTracker />
      </body>
    </html>
  );
}
