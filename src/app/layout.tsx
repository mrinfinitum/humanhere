import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://humanhere.co"),
  title: {
    default: "HUMAN:HERE | People Need People",
    template: "%s | HUMAN:HERE",
  },
  description: "HUMAN:HERE brings people and organizations together to meet real needs, strengthen communities, and show up for people with compassion, dignity, and love.",
  openGraph: {
    title: "HUMAN:HERE | People Need People",
    description: "People still need people. Show up for someone.",
    url: "https://humanhere.co",
    siteName: "HUMAN:HERE",
    images: [
      {
        url: "/images/hero-maya.jpg",
        width: 1536,
        height: 1024,
        alt: "HUMAN:HERE — People Need People",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HUMAN:HERE | People Need People",
    description: "People still need people. Show up for someone.",
    images: ["/images/hero-maya.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
