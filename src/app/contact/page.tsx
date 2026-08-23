import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Contact", description: "Contact HUMAN:HERE." };
export default function ContactPage() { return <><main><PageHero eyebrow="Contact" title="Let’s talk." image="/images/portrait-james.jpg" imageAlt="Portrait fixture" imagePosition="center 28%" />
  <section className="contact-section shell"><div><p className="eyebrow">Connect</p><h2>Start with a hello.</h2></div><div className="contact-details"><a href="mailto:hello@humanhere.co">hello@humanhere.co <span>↗</span></a><p>Tulsa, Oklahoma</p><p>For volunteering, partnerships, prayer, giving, or simply learning more.</p></div></section>
  </main><SiteFooter /></>; }
