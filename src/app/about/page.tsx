import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "About", description: "Why HUMAN:HERE exists: people still have to show up for people." };

export default function AboutPage() {
  return <><main><PageHero eyebrow="About" title="People need people." image="/images/community-table.jpg" imageAlt="Neighbors gathered around a shared table" />
    <section className="editorial-intro shell"><p className="eyebrow">Our story</p><h2>We believe the distance between people changes when someone chooses to cross it.</h2><div><p>HUMAN:HERE brings people and organizations together to meet real needs with dignity, compassion, and presence.</p><p>We begin with people—not programs, labels, or statistics. A name and a story can change the distance between us.</p></div></section>
    <section className="split-feature split-feature--cream"><figure><Image src="/images/portrait-lena.jpg" alt="Portrait fixture" fill sizes="(max-width: 800px) 100vw, 50vw" /></figure><div className="split-feature__copy"><p className="eyebrow">Why we show up</p><h2>Faith should move toward people.</h2><p>Jesus taught us to see people others pass by, love our neighbors, and serve with humility. Our faith is why we act. Our help is offered with dignity and without condition.</p></div></section>
    <section className="values-section shell"><p className="eyebrow">Our values</p><div><article><span>01</span><h3>Human first</h3><p>A person is never a project.</p></article><article><span>02</span><h3>Listen closely</h3><p>Care begins with attention.</p></article><article><span>03</span><h3>Protect dignity</h3><p>Consent is part of the story.</p></article><article><span>04</span><h3>Stay present</h3><p>Trust is built over time.</p></article></div><Link href="/get-involved" className="text-link">Find your place <span>→</span></Link></section>
  </main><SiteFooter /></>;
}
