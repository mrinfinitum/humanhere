import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// One variable family: normal width for reading, the wide axis for display type.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.humanhere.co"),
  title: {
    default: "HUMAN:HERE | People Need People",
    template: "%s | HUMAN:HERE",
  },
  description: "HUMAN:HERE brings people and organizations together to meet real needs, strengthen communities, and show up for people with compassion, dignity, and love.",
  openGraph: {
    title: "HUMAN:HERE | People Need People",
    description: "People still need people. Show up for someone.",
    url: "https://www.humanhere.co",
    siteName: "HUMAN:HERE",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HUMAN:HERE | People Need People",
    description: "People still need people. Show up for someone.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
