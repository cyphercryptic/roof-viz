import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'RoofViz - AI Roof Visualization for Sales',
    template: '%s | RoofViz',
  },
  description: 'Show homeowners their new roof before the first shingle is laid. AI-powered roof visualization for roofing sales teams.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://roofviz.com'),
  openGraph: {
    title: 'RoofViz - AI Roof Visualization for Sales',
    description: 'Show homeowners their new roof before the first shingle is laid. AI-powered roof visualization for roofing sales teams.',
    siteName: 'RoofViz',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoofViz - AI Roof Visualization for Sales',
    description: 'Show homeowners their new roof before the first shingle is laid. AI-powered roof visualization for roofing sales teams.',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
