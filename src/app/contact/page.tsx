import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = { title: "Contact", description: "Contact HUMAN:HERE." };

export default function ContactPage() {
  return (
    <><Header /><main id="main-content" className="single-action-page"><p>Contact</p><h1>Let&apos;s talk<span>.</span></h1><div><p>Tulsa, Oklahoma</p><Link className="text-link" href="mailto:hello@humanhere.co">hello@humanhere.co <span aria-hidden="true">↗</span></Link></div></main><Footer /></>
  );
}
