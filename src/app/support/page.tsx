import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { QuietHeader } from "@/components/QuietHeader";

const description = "Support HUMAN:HERE and help fund human storytelling, community connections, outreach, technology, and practical ways for people to show up for one another.";

export const metadata: Metadata = {
  title: { absolute: "Support HUMAN:HERE | People Need People" }, description, alternates: { canonical: "/support" },
  openGraph: { title: "Support HUMAN:HERE | People Need People", description, url: "/support", siteName: "HUMAN:HERE", images: [{ url: "/images/community-table.jpg", width: 1536, height: 1024, alt: "People gathered around a community table" }], locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: "Support HUMAN:HERE | People Need People", description, images: ["/images/community-table.jpg"] },
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

export default function SupportPage() {
  return (
    <main className="manifesto-page support-page">
      <QuietHeader />
      <section className="manifesto-hero support-hero" aria-labelledby="support-title">
        <div className="manifesto-hero__index" aria-hidden="true">01 / SUPPORT</div><h1 id="support-title">Support the work.<br />Not the algorithm.</h1>
        <div className="manifesto-hero__copy"><p>HUMAN:HERE exists to reach people, tell real stories, connect real needs, and help people show up for one another.</p><p>We do not run advertising around people’s stories. We rely on people, churches, businesses, foundations, and partners who believe this work should exist.</p><div className="hero-actions"><Link href="/contact?reason=give">Support HUMAN:HERE <span aria-hidden="true">→</span></Link><Link href="/contact?reason=monthly-support">Become a monthly supporter <span aria-hidden="true">→</span></Link></div><small>Online donation processing is not yet connected. These links start a conversation and do not collect payment.</small></div>
      </section>

      <section className="funding-principle" aria-labelledby="funding-principle-title">
        <p className="section-code">02 / THE LINE WE HOLD</p><h2 id="funding-principle-title">We will never<br />sell a person’s pain.</h2>
        <ul><li>No display advertising around human stories.</li><li>No selling personal data.</li><li>No charging someone to ask for help.</li><li>No paying to be featured.</li><li>No turning trauma into engagement bait.</li></ul>
        <p>We don’t monetize people’s pain.<br /><strong>We fund the work around it.</strong></p>
      </section>

      <section className="support-actions ruled-section" aria-labelledby="support-actions-title">
        <div className="section-heading"><p className="section-code">03 / WAYS TO SUPPORT</p><h2 id="support-actions-title">Put your support<br />where people are.</h2></div>
        {supportActions.map(([code, title, body, href, link]) => <article key={title}><span aria-hidden="true">{code}</span><h3>{title}</h3><p>{body}</p><Link className="text-arrow" href={href}>{link} <span aria-hidden="true">→</span></Link></article>)}
        <article><span aria-hidden="true">05</span><h3>Buy / wear / share</h3><p>A HUMAN:HERE shirt is not just merchandise. It’s a message walking through the world. PEOPLE NEED PEOPLE.</p><span className="coming-soon">Shop coming soon</span></article>
      </section>

      <section className="support-image-break" aria-label="Community connection"><figure><Image src="/images/community-table.jpg" alt="Neighbors gathering and connecting around a shared table" fill sizes="100vw" /></figure><p>People supporting people.<br />Work rooted in real places.</p></section>

      <section className="funding-areas ruled-section" aria-labelledby="funding-areas-title">
        <div className="funding-areas__heading"><p className="section-code">04 / WHERE SUPPORT GOES</p><h2 id="funding-areas-title">Fund the work<br />around the mission.</h2><p>These are examples of work support may fund. They are not audited allocation percentages.</p></div>
        <dl>{fundingAreas.map(([term, detail], index) => <div key={term}><dt><span>{String(index + 1).padStart(2, "0")}</span>{term}</dt><dd>{detail}</dd></div>)}</dl>
      </section>

      <section className="support-beyond" aria-labelledby="beyond-title"><p className="section-code">05 / SHOW UP</p><h2 id="beyond-title">Money isn’t<br />the only way<br />to show up.</h2><nav aria-label="Ways to support without giving money">{beyondMoney.map(([label, href]) => <Link key={label} href={href}>{label}<span aria-hidden="true">↗</span></Link>)}</nav></section>

      <section className="organization-section ruled-section" aria-labelledby="organizations-title"><p className="section-code">06 / ORGANIZATIONS</p><h2 id="organizations-title">Show up together.</h2><div className="organization-section__copy"><p>HUMAN:HERE welcomes businesses, churches, foundations, and community organizations that want to help people without turning human stories into advertising.</p><Link className="text-arrow" href="/contact?reason=partner">Let’s talk <span aria-hidden="true">→</span></Link></div><ul aria-label="Potential partnership types"><li>Community Partner</li><li>Story Project Partner</li><li>City Partner</li><li>Initiative Partner</li><li>Founding Partner</li></ul></section>

      <section className="grants-section ruled-section" aria-labelledby="grants-title"><p className="section-code">07 / FOUNDATIONS + GRANTS</p><h2 id="grants-title">A model built<br />to connect.</h2><div><p>HUMAN:HERE is developing a scalable model around human storytelling, community connection, volunteerism, social isolation, poverty, housing instability, family crisis, faith-based service, and local collaboration.</p><p>We make no unsupported claim about current grant eligibility.</p><Link className="text-arrow" href="/contact?reason=foundation">Contact HUMAN:HERE <span aria-hidden="true">→</span></Link></div></section>

      <section className="manifesto-closing support-closing" aria-labelledby="support-closing-title"><p className="section-code">08 / PEOPLE NEED PEOPLE</p><h2 id="support-closing-title">You don’t have<br />to fix everything.</h2><p>Show up for someone.</p><small>People need people.</small><nav aria-label="Support HUMAN:HERE"><Link href="/contact?reason=give">Give <span aria-hidden="true">→</span></Link><Link href="/contact?reason=partner">Partner <span aria-hidden="true">→</span></Link><Link href="/contact?reason=volunteer">Volunteer <span aria-hidden="true">→</span></Link><Link href="/contact?reason=pray">Pray <span aria-hidden="true">→</span></Link></nav></section>
    </main>
  );
}
