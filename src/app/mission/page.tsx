import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { QuietHeader } from "@/components/QuietHeader";

const description = "HUMAN:HERE helps people see one another, share real stories, connect real needs, and show up for one another with dignity, compassion, and love.";

export const metadata: Metadata = {
  title: { absolute: "Our Mission | HUMAN:HERE" },
  description,
  alternates: { canonical: "/mission" },
  openGraph: { title: "Our Mission | HUMAN:HERE", description, url: "/mission", siteName: "HUMAN:HERE", images: [{ url: "/images/hero-maya.jpg", width: 1536, height: 1024, alt: "A portrait from the HUMAN:HERE living archive" }], locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: "Our Mission | HUMAN:HERE", description, images: ["/images/hero-maya.jpg"] },
};

const burdens = ["Homelessness", "Grief", "Loneliness", "Recovery", "Financial hardship", "Family crisis", "Fear", "Starting over", "Caring for someone", "Needing help", "Wanting to help"];
const labels = ["homeless", "addicted", "poor", "abused", "broken", "unemployed", "alone"];

export default function MissionPage() {
  return (
    <main className="manifesto-page mission-page">
      <QuietHeader />
      <section className="manifesto-hero mission-hero" aria-labelledby="mission-title">
        <div className="manifesto-hero__index" aria-hidden="true">01 / MISSION</div>
        <h1 id="mission-title"><span>People</span><span>Need</span><span>People.</span></h1>
        <figure className="mission-hero__portrait">
          <Image src="/images/hero-maya.jpg" alt="Maya, photographed for the HUMAN:HERE living archive" fill priority sizes="(max-width: 820px) 100vw, 38vw" />
          <figcaption>Real people. Real stories. Human dignity.</figcaption>
        </figure>
        <div className="manifesto-hero__copy">
          <p>Everyone is carrying something.<br />Some struggles are visible.<br />Most are not.</p>
          <p>HUMAN:HERE exists to help people see one another, share real stories, meet real needs, and show up for one another.</p>
          <Link className="text-arrow" href="/humans">Meet someone <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="mission-statement ruled-section" aria-labelledby="mission-statement-title">
        <p className="section-code">02 / OUR MISSION</p>
        <h2 id="mission-statement-title">HUMAN:HERE exists to connect people through honest human stories, raise awareness of real needs, and help individuals, churches, businesses, and organizations show up for people with dignity, compassion, and practical support.</h2>
      </section>

      <section className="burden-section ruled-section" aria-labelledby="burden-title">
        <div className="burden-section__heading"><p className="section-code">03 / WHO THIS IS FOR</p><h2 id="burden-title">HUMAN:HERE is for anyone carrying something.</h2></div>
        <ul aria-label="Examples of what people may be carrying">{burdens.map((burden, index) => <li key={burden}><span>{String(index + 1).padStart(2, "0")}</span>{burden}</li>)}</ul>
        <p className="burden-section__close">You do not have to fit a category to matter here.</p>
      </section>

      <section className="mission-movements ruled-section" aria-labelledby="movements-title">
        <div className="section-heading"><p className="section-code">04 / THE MOVEMENT</p><h2 id="movements-title">See. Be seen. Show up.</h2></div>
        <article><span aria-hidden="true">01</span><h3>See someone</h3><p>Real faces. Real voices. Real stories. We believe seeing another person clearly is often where compassion begins.</p></article>
        <article><span aria-hidden="true">02</span><h3>Be seen</h3><p>Everyone deserves to be heard. HUMAN:HERE gives people a place to share what they are carrying, whether publicly, privately, or anonymously.</p></article>
        <article><span aria-hidden="true">03</span><h3>Show up</h3><p>Awareness should lead somewhere. We help connect people with individuals, churches, nonprofits, businesses, and resources that may be able to help.</p></article>
      </section>

      <section className="image-statement" aria-labelledby="stories-title">
        <figure><Image src="/images/portrait-james.jpg" alt="James looking directly into the camera" fill sizes="(max-width: 820px) 100vw, 48vw" /></figure>
        <div><p className="section-code">05 / WHY STORIES</p><h2 id="stories-title">Every number<br />has a name.</h2><p>Statistics can tell us how large a problem is. Stories remind us that every number represents a person. A face. A family. A history. A hope. A human.</p></div>
      </section>

      <section className="faith-section" aria-labelledby="faith-title">
        <p className="section-code">06 / WHY WE SHOW UP</p>
        <h2 id="faith-title">Faith that moves<br />toward people.</h2>
        <p>Jesus taught us to see people others pass by, love our neighbors, draw near to those who are hurting, and serve with humility.</p>
        <p>Our faith is why we act. Our help is offered with dignity, without condition, and without requiring anyone to share our beliefs.</p>
      </section>

      <section className="labels-section ruled-section" aria-labelledby="labels-title">
        <p className="section-code">07 / HUMAN, FIRST</p><h2 id="labels-title">We are not here<br />to label people.</h2><p>We do not believe a person should be reduced to:</p>
        <ul aria-label="Labels that do not define a human">{labels.map((label) => <li key={label}>{label}</li>)}</ul>
        <p className="labels-section__close">Circumstances describe part of a story.<br />They do not define a human.</p>
      </section>

      <section className="partnership-section ruled-section" aria-labelledby="partnership-title">
        <p className="section-code">08 / PARTNERSHIP</p><h2 id="partnership-title">We don’t have to<br />do everything.</h2>
        <div><p>We want to help people find the organizations, churches, resources, and people already doing meaningful work.</p><p>HUMAN:HERE can help make the need visible, make the story human, and make the connection possible.</p><Link className="text-arrow" href="/contact?reason=partner">Partner with HUMAN:HERE <span aria-hidden="true">→</span></Link></div>
      </section>

      <section className="manifesto-closing" aria-labelledby="mission-closing-title">
        <p className="section-code">09 / HUMAN:HERE</p><h2 id="mission-closing-title">See people.<br />Serve people.<br />Love people.</h2><p>People need people.</p>
        <nav aria-label="Continue from the mission page"><Link href="/humans">Meet someone <span aria-hidden="true">→</span></Link><Link href="/share">Share your story <span aria-hidden="true">→</span></Link><Link href="/support">Show up <span aria-hidden="true">→</span></Link></nav>
      </section>
    </main>
  );
}
