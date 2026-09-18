import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

// DM Sans gives the public site and workspace a consistent, readable voice.
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Retained for compact technical values where a monospaced face is useful.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: 'ExteriorViz — Roofing, Window & Door Visualization',
    template: '%s | ExteriorViz',
  },
  description:
    'Preview roofing, windows and doors on a real home photo. One workspace for your product catalog, visualizations and customer presentations.',
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: 'ExteriorViz — Roofing, Window & Door Visualization',
    description:
      'Help homeowners explore roofing, window and door options with AI previews of their own home.',
    siteName: 'ExteriorViz',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExteriorViz — Roofing, Window & Door Visualization',
    description:
      'Help homeowners explore roofing, window and door options with AI previews of their own home.',
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
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3 focus:text-brand-brown">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
