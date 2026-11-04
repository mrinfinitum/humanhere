import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import "./mission-large.css";

const description = "HUMAN:HERE helps people see one another, share real stories, connect real needs, and show up for one another with dignity, compassion, and love.";

export const metadata: Metadata = {
  title: { absolute: "Our Mission | HUMAN:HERE" },
  description,
  alternates: { canonical: "/mission" },
  openGraph: { title: "Our Mission | HUMAN:HERE", description, url: "/mission", siteName: "HUMAN:HERE", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "HUMAN:HERE. People need people." }], locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: "Our Mission | HUMAN:HERE", description, images: ["/twitter-image"] },
};

const burdens = ["Homelessness", "Grief", "Loneliness", "Recovery", "Financial hardship", "Family crisis", "Fear", "Starting over", "Caring for someone", "Needing help", "Wanting to help"];
const labels = ["homeless", "addicted", "poor", "abused", "broken", "unemployed", "alone"];

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

const movements = [
  ["01", "See someone", "Real faces. Real voices. Real stories. We believe seeing another person clearly is often where compassion begins."],
  ["02", "Be seen", "Everyone deserves to be heard. HUMAN:HERE gives people a place to share what they are carrying, whether publicly, privately, or anonymously."],
  ["03", "Show up", "Awareness should lead somewhere. We help connect people with individuals, churches, nonprofits, businesses, and resources that may be able to help."],
];

export default function MissionPage() {
  return (
    <main className="member-shell give-page mission-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <SiteNav />
      </header>

      <section className="give-hero" aria-labelledby="mission-title">
        <p className="member-kicker"><i aria-hidden="true" /> Our mission</p>
        <h1 id="mission-title">People need<br /><em>people.</em></h1>
        <div className="give-hero__copy">
          <p className="mission-lede">Everyone is carrying something. Some struggles are visible. Most are not.</p>
          <p>HUMAN:HERE exists to help people see one another, share real stories, meet real needs, and show up for one another.</p>
          <div className="give-buttons"><Link className="give-button give-button--primary" href="/world">Meet someone <Arrow /></Link><Link className="give-button" href="/share">Share your story <Arrow /></Link></div>
        </div>
      </section>

      <figure className="give-photo mission-photo">
        <Image src="/images/hero-maya.jpg" alt="Maya, photographed for the HUMAN:HERE living archive" fill priority sizes="(max-width: 760px) 100vw, 1120px" />
        <figcaption>Real people. Real stories. Human dignity.</figcaption>
      </figure>

      <section className="give-section" aria-labelledby="mission-statement-title">
        <h2 className="give-code" id="mission-statement-title">Our mission</h2>
        <p className="mission-big">HUMAN:HERE exists to connect people through honest human stories, raise awareness of real needs, and help individuals, churches, businesses, and organizations show up for people with dignity, compassion, and practical support.</p>
      </section>

      <section className="give-section give-promise" aria-labelledby="burden-title">
        <div className="give-heading"><p className="give-code">Who this is for</p><h2 id="burden-title">HUMAN:HERE is for anyone carrying something.</h2><p>You do not have to fit a category to matter here.</p></div>
        <ul className="give-panel mission-burdens" aria-label="Examples of what people may be carrying">{burdens.map(burden => <li key={burden}>{burden}</li>)}</ul>
      </section>

      <section className="give-section" aria-labelledby="movements-title">
        <div className="give-heading"><p className="give-code">The movement</p><h2 id="movements-title">See. Be seen. Show up.</h2></div>
        <div className="give-cards give-cards--three">
          {movements.map(([code, title, body]) => <article key={title} className="give-card"><span aria-hidden="true">{code}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="give-section mission-split" aria-labelledby="stories-title">
        <figure className="give-photo"><Image src="/images/portrait-james.jpg" alt="James looking directly into the camera" fill sizes="(max-width: 860px) 100vw, 540px" /></figure>
        <div className="give-heading"><p className="give-code">Why stories</p><h2 id="stories-title">Every number has a name.</h2><p>Statistics can tell us how large a problem is. Stories remind us that every number represents a person. A face. A family. A history. A hope. A human.</p></div>
      </section>

      <section className="give-section give-promise" aria-labelledby="faith-title">
        <div className="give-heading"><p className="give-code">Why we show up</p><h2 id="faith-title">Faith that moves toward people.</h2></div>
        <div className="give-panel mission-faith">
          <p>Jesus taught us to see people others pass by, love our neighbors, draw near to those who are hurting, and serve with humility.</p>
          <p>Our faith is why we act. Our help is offered with dignity, without condition, and without requiring anyone to share our beliefs.</p>
        </div>
      </section>

      <section className="give-section" aria-labelledby="labels-title">
        <div className="give-heading"><p className="give-code">Human, first</p><h2 id="labels-title">We are not here to label people.</h2><p>We do not believe a person should be reduced to:</p></div>
        <ul className="mission-labels" aria-label="Labels that do not define a human">{labels.map(label => <li key={label}>{label}</li>)}</ul>
        <p className="mission-close">Circumstances describe part of a story. <strong>They do not define a human.</strong></p>
      </section>

      <section className="give-section give-pair" aria-label="Partnership">
        <article className="give-panel" aria-labelledby="partnership-title">
          <p className="give-code">Partnership</p><h2 id="partnership-title">We don’t have to do everything.</h2>
          <p>We want to help people find the organizations, churches, resources, and people already doing meaningful work.</p>
          <p>HUMAN:HERE can help make the need visible, make the story human, and make the connection possible.</p>
          <Link className="give-button" href="/contact?reason=partner">Partner with HUMAN:HERE <Arrow /></Link>
        </article>
        <article className="give-panel" aria-labelledby="mission-give-title">
          <p className="give-code">Support the work</p><h2 id="mission-give-title">Fund the work, never the pain.</h2>
          <p>We do not run advertising around people’s stories. People, churches, businesses and foundations who believe in this work keep it going.</p>
          <Link className="give-button" href="/give">Ways to give <Arrow /></Link>
        </article>
      </section>

      <section className="give-closing" aria-labelledby="mission-closing-title">
        <p className="member-kicker"><i aria-hidden="true" /> HUMAN:HERE</p>
        <h2 id="mission-closing-title">See people. Serve people. Love people.</h2>
        <p>People need people.</p>
        <nav className="give-buttons" aria-label="Continue from the mission page"><Link className="give-button give-button--primary" href="/world">Meet someone <Arrow /></Link><Link className="give-button" href="/share">Share your story <Arrow /></Link><Link className="give-button" href="/give">Show up <Arrow /></Link></nav>
      </section>

      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></small></footer>
    </main>
  );
}
