import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = { title: "Give", description: "Support HUMAN:HERE and help people show up for people." };

export default function GivePage() {
  return (
    <><Header /><main id="main-content" className="single-action-page"><p>Give</p><h1>Help someone<br />show up<span>.</span></h1><div><p>We are preparing a secure giving experience.</p><Link className="text-link" href="mailto:hello@humanhere.co?subject=I want to give">Start a conversation <span aria-hidden="true">↗</span></Link></div></main><Footer /></>
  );
}
