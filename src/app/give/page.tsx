import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

const description = "Support HUMAN:HERE and help fund human storytelling, community connections, outreach, technology, and practical ways for people to show up for one another.";

export const metadata: Metadata = {
  title: { absolute: "Give | HUMAN:HERE" }, description, alternates: { canonical: "/give" },
  openGraph: { title: "Give | HUMAN:HERE", description, url: "/give", siteName: "HUMAN:HERE", images: [{ url: "/images/community-table.jpg", width: 1536, height: 1024, alt: "People gathered around a community table" }], locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: "Give | HUMAN:HERE", description, images: ["/images/community-table.jpg"] },
};

const supportActions = [
  ["01", "Give", "Help fund storytelling, outreach, technology, moderation, community connections, and real-world support.", "/contact?reason=give", "Give once"],
  ["02", "Give monthly", "Recurring support gives HUMAN:HERE the stability to keep showing up month after month.", "/contact?reason=monthly-support", "Become a monthly supporter"],
  ["03", "Partner", "Businesses, churches, and organizations can help underwrite local story projects, community outreach, events, technology, and resource connections.", "/contact?reason=partner", "Become a partner"],
  ["04", "Fund a project", "Help fund a city campaign, a collection of human stories, a category of need, or a HUMAN:HERE community project—never an individual person’s pain.", "/contact?reason=project", "Start a conversation"],
];
const fundingAreas = [
  ["Storytelling", "Photography / Video / Editing / Story production / Accessibility / Transcription"],
  ["Technology", "humanhere.co / Secure submissions / Private media / Moderation tools / Social discovery"],
  ["Community", "Resource connections / Partner outreach / Local initiatives / Volunteer coordination"],
  ["Reach", "Social storytelling / Physical campaigns / QR decals / Events / Community installations"],
];
const beyondMoney = [["Share a story", "/share"], ["Volunteer", "/contact?reason=volunteer"], ["Pray", "/contact?reason=pray"], ["Introduce a partner", "/contact?reason=partner"], ["Host HUMAN:HERE", "/contact?reason=host"], ["Wear the message", "/contact?reason=merch"], ["Put up a decal", "/contact?reason=decal"], ["Tell someone they matter", "/humans"]];

const promises = ["No display advertising around human stories.", "No selling personal data.", "No charging someone to ask for help.", "No paying to be featured.", "No turning trauma into engagement bait."];
const organizationTypes = ["Community Partner", "Story Project Partner", "City Partner", "Initiative Partner", "Founding Partner"];

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

export default function GivePage() {
  return (
    <main className="member-shell give-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <SiteNav />
      </header>

      <section className="give-hero" aria-labelledby="support-title">
        <p className="member-kicker"><i aria-hidden="true" /> Give to HUMAN:HERE</p>
        <h1 id="support-title">Support the work.<br /><em>Not the algorithm.</em></h1>
        <div className="give-hero__copy">
          <p>HUMAN:HERE exists to reach people, tell real stories, connect real needs, and help people show up for one another.</p>
          <p>We do not run advertising around people’s stories. We rely on people, churches, businesses, foundations, and partners who believe this work should exist.</p>
          <div className="give-buttons"><Link className="give-button give-button--primary" href="/contact?reason=give">Support HUMAN:HERE <Arrow /></Link><Link className="give-button" href="/contact?reason=monthly-support">Give monthly <Arrow /></Link></div>
          <small>Online donation processing is not yet connected. These links start a conversation and do not collect payment.</small>
        </div>
      </section>

      <section className="give-section give-promise" aria-labelledby="funding-principle-title">
        <div className="give-heading"><p className="give-code">The line we hold</p><h2 id="funding-principle-title">We will never sell a person’s pain.</h2><p>We don’t monetize people’s pain. <strong>We fund the work around it.</strong></p></div>
        <ul className="give-panel">{promises.map(item => <li key={item}><i aria-hidden="true" />{item}</li>)}</ul>
      </section>

      <section className="give-section" aria-labelledby="support-actions-title">
        <div className="give-heading"><p className="give-code">Ways to support</p><h2 id="support-actions-title">Put your support where people are.</h2></div>
        <div className="give-cards">
          {supportActions.map(([code, title, body, href, link]) => <article key={title} className="give-card"><span aria-hidden="true">{code}</span><h3>{title}</h3><p>{body}</p><Link href={href}>{link} <Arrow /></Link></article>)}
          <article className="give-card"><span aria-hidden="true">05</span><h3>Buy, wear, share</h3><p>A HUMAN:HERE shirt is not just merchandise. It’s a message walking through the world. People need people.</p><em className="give-soon">Shop coming soon</em></article>
        </div>
      </section>

      <figure className="give-photo">
        <Image src="/images/community-table.jpg" alt="Neighbors gathering and connecting around a shared table" fill sizes="(max-width: 760px) 100vw, 1120px" />
        <figcaption>People supporting people. Work rooted in real places.</figcaption>
      </figure>

      <section className="give-section" aria-labelledby="funding-areas-title">
        <div className="give-heading"><p className="give-code">Where support goes</p><h2 id="funding-areas-title">Fund the work around the mission.</h2><p>These are examples of work support may fund. They are not audited allocation percentages.</p></div>
        <dl className="give-areas">{fundingAreas.map(([term, detail], index) => <div key={term} className="give-panel"><dt><span>{String(index + 1).padStart(2, "0")}</span>{term}</dt><dd>{detail.split(" / ").map(item => <span key={item}>{item}</span>)}</dd></div>)}</dl>
      </section>

      <section className="give-section" aria-labelledby="beyond-title">
        <div className="give-heading"><p className="give-code">Show up</p><h2 id="beyond-title">Money isn’t the only way to show up.</h2></div>
        <nav className="give-chips" aria-label="Ways to support without giving money">{beyondMoney.map(([label, href]) => <Link key={label} href={href}>{label}<span aria-hidden="true">↗</span></Link>)}</nav>
      </section>

      <section className="give-section give-pair" aria-label="Organizations and foundations">
        <article className="give-panel" aria-labelledby="organizations-title">
          <p className="give-code">Organizations</p><h2 id="organizations-title">Show up together.</h2>
          <p>HUMAN:HERE welcomes businesses, churches, foundations, and community organizations that want to help people without turning human stories into advertising.</p>
          <ul className="give-tags" aria-label="Potential partnership types">{organizationTypes.map(type => <li key={type}>{type}</li>)}</ul>
          <Link className="give-button" href="/contact?reason=partner">Let’s talk <Arrow /></Link>
        </article>
        <article className="give-panel" aria-labelledby="grants-title">
          <p className="give-code">Foundations and grants</p><h2 id="grants-title">A model built to connect.</h2>
          <p>HUMAN:HERE is developing a scalable model around human storytelling, community connection, volunteerism, social isolation, poverty, housing instability, family crisis, faith-based service, and local collaboration.</p>
          <p className="give-note">We make no unsupported claim about current grant eligibility.</p>
          <Link className="give-button" href="/contact?reason=foundation">Contact HUMAN:HERE <Arrow /></Link>
        </article>
      </section>

      <section className="give-closing" aria-labelledby="support-closing-title">
        <p className="member-kicker"><i aria-hidden="true" /> People need people</p>
        <h2 id="support-closing-title">You don’t have to fix everything.</h2>
        <p>Show up for someone.</p>
        <nav className="give-buttons" aria-label="Support HUMAN:HERE"><Link className="give-button give-button--primary" href="/contact?reason=give">Give <Arrow /></Link><Link className="give-button" href="/contact?reason=partner">Partner <Arrow /></Link><Link className="give-button" href="/contact?reason=volunteer">Volunteer <Arrow /></Link><Link className="give-button" href="/contact?reason=pray">Pray <Arrow /></Link></nav>
      </section>

      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></small></footer>
    </main>
  );
}
