import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Give", description: "Support HUMAN:HERE and help people show up for people." };
export default function GivePage() { return <><main><PageHero eyebrow="Give" title="Help someone show up." image="/images/portrait-miguel.jpg" imageAlt="Portrait fixture" imagePosition="center 30%" />
  <section className="editorial-intro shell"><p className="eyebrow">Support the work</p><h2>Generosity can turn attention into practical care.</h2><div><p>We are preparing a secure giving experience. Until it is ready, start a conversation with our team.</p><Link href="mailto:hello@humanhere.co?subject=I want to give" className="text-link">Start a conversation <span>↗</span></Link></div></section>
  <section className="impact-section"><div className="shell"><div className="impact-title"><p className="eyebrow">What matters</p><h2>Transparent.<br />Personal. Local.</h2></div><div className="impact-stats"><article><strong>100%</strong><span>Human dignity</span></article><article><strong>1:1</strong><span>Relationship first</span></article><article><strong>Here</strong><span>Rooted in Tulsa</span></article></div></div></section>
  </main><SiteFooter /></>; }
