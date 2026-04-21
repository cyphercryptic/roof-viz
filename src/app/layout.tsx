import type { Metadata } from "next";
import { Fraunces, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Fraunces — variable display serif with optical sizing. Warm, tactile, editorial.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

// DM Sans — refined geometric humanist sans. Pairs well with Fraunces.
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// JetBrains Mono — editorial metadata (labels, section numbers, fine-print).
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: 'RoofViz — AI Roof Visualization for Sales Teams',
    template: '%s | RoofViz',
  },
  description:
    'Walk in with the after. Snap a home photo, pick a shingle, hand back a photorealistic roof — in under a minute.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://roofviz.com'),
  openGraph: {
    title: 'RoofViz — AI Roof Visualization for Sales Teams',
    description:
      'Walk in with the after. AI-powered photorealistic roof visualization for roofing sales teams.',
    siteName: 'RoofViz',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoofViz — AI Roof Visualization for Sales Teams',
    description:
      'Walk in with the after. AI-powered photorealistic roof visualization for roofing sales teams.',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
