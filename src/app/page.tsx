import Link from "next/link";
import { ArchiveRows } from "@/components/ArchiveRows";
import { EditorialShell } from "@/components/EditorialShell";
import { PanelFooter } from "@/components/PanelFooter";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

export default function Home() {
  return (
    <EditorialShell current="Welcome">
      <article className="panel-document">
        <section className="panel-introduction">
          <h1>Welcome to HUMAN:HERE</h1>
          <p>We are a human-centered nonprofit built around a simple belief: in a world shaped by technology, people still need people.</p>
          <p>We help people, churches, businesses, volunteers, and community organizations show up for real people — <Link href="/about">read why</Link>.</p>
        </section>

        <section className="panel-section">
          <h2>Meet people</h2>
          <p className="section-description">The beginning of a human archive. Every public entry will become a real, consented portrait and story.</p>
          <ArchiveRows people={DEV_FIXTURE_PEOPLE} />
        </section>

        <section className="panel-section">
          <h2>Starting points</h2>
          <p className="section-description">Two ways into the work and the belief behind it.</p>
          <div className="collection-links">
            <Link href="/people"><strong>People</strong><span>Meet the human beings at the center of the work.</span><small>Archive · {DEV_FIXTURE_PEOPLE.length} entries</small></Link>
            <Link href="/about"><strong>People need people</strong><span>Why presence still matters.</span><small>About · Our belief</small></Link>
          </div>
        </section>

        <section className="panel-section statement-panel">
          <h2>What we believe</h2>
          <blockquote>Technology can connect us. Systems can support us. But people still have to show up.</blockquote>
        </section>

        <section className="panel-section">
          <h2>Show up</h2>
          <p className="section-description">Choose a way to stand with someone.</p>
          <nav className="action-list" aria-label="Ways to get involved">
            <Link href="/give"><span>Give</span><small>Support the work</small></Link>
            <Link href="/contact?interest=volunteer"><span>Volunteer</span><small>Offer your time</small></Link>
            <Link href="/contact?interest=partner"><span>Partner</span><small>Work together</small></Link>
            <Link href="/contact?interest=pray"><span>Pray</span><small>Stand with people</small></Link>
          </nav>
        </section>
        <PanelFooter />
      </article>
    </EditorialShell>
  );
}
