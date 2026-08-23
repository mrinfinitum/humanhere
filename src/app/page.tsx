import Image from "next/image";
import Link from "next/link";
import { PeopleGrid } from "@/components/PeopleGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader overlay />
      <main>
        <section className="home-hero">
          <Image src="/images/community-table.jpg" alt="Neighbors sharing a meal around a table" fill priority sizes="100vw" />
          <div className="home-hero__shade" />
          <div className="shell home-hero__content">
            <h1>Because people still need people.</h1>
            <Link href="/about" className="text-link text-link--light">Find out why <span>→</span></Link>
          </div>
          <div className="hero-location"><span>Tulsa, Oklahoma</span><i aria-hidden="true">⌖</i></div>
          <span className="hero-rule" aria-hidden="true" />
          <a className="scroll-cue" href="#about" aria-label="Scroll to about">↓</a>
        </section>

        <section className="mission-section shell" id="about">
          <div className="section-heading"><p className="eyebrow">About</p><h2>HUMAN:HERE is a human-centered nonprofit.</h2></div>
          <div className="mission-copy"><p>We bring people, churches, businesses, volunteers, and community organizations together to meet real needs with dignity and presence.</p><p>Why? Because technology can connect us and systems can support us—but people still have to show up.</p></div>
        </section>

        <section className="split-feature split-feature--navy">
          <div className="split-feature__copy">
            <p className="eyebrow">The challenge</p>
            <h2>It is possible to be surrounded—and still unseen.</h2>
            <p>Too many people are known by a circumstance before they are known by a name. Distance grows when stories become statistics and care becomes a transaction.</p>
            <Link href="/about" className="text-link text-link--light">Read more <span>→</span></Link>
          </div>
          <figure><Image src="/images/hero-maya.jpg" alt="Portrait fixture representing a person being seen" fill sizes="(max-width: 800px) 100vw, 50vw" /></figure>
        </section>

        <section className="approach-section">
          <div className="shell">
            <p className="eyebrow">How we begin</p>
            <div className="approach-heading"><h2>See <span>+</span> Stand with <span>+</span> Show up</h2></div>
            <div className="approach-grid">
              <article><span>01</span><h3>See the person</h3><p>Begin with a name, a face, a story, dignity, and worth.</p></article>
              <article><span>02</span><h3>Stand with them</h3><p>Listen first. Let relationship—not assumption—shape the response.</p></article>
              <article><span>03</span><h3>Show up together</h3><p>Turn shared concern into practical, faithful, human action.</p></article>
            </div>
          </div>
        </section>

        <section className="impact-section">
          <div className="shell"><div className="impact-title"><p className="eyebrow">Our beginning</p><h2>Small numbers.<br />Real people.</h2></div><div className="impact-stats"><article><strong>4</strong><span>Development stories</span></article><article><strong>1</strong><span>City to begin in</span></article><article><strong>1</strong><span>Shared belief</span></article></div></div>
        </section>

        <section className="featured-section shell">
          <div className="section-topline"><div><p className="eyebrow">People</p><h2>Meet the people at the center.</h2></div><Link href="/people" className="text-link">View all <span>→</span></Link></div>
          <PeopleGrid limit={3} />
        </section>

        <section className="promise-section">
          <div className="shell"><p className="eyebrow">Our promise</p><blockquote>We will tell stories with people, not about them. We will protect dignity, ask permission, and never make pain perform for attention.</blockquote><Link href="/get-involved" className="round-link" aria-label="Get involved">↗</Link></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
