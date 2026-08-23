import type { Metadata } from "next";
import Link from "next/link";
import { PeopleField } from "@/components/PeopleField";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

export const metadata: Metadata = { title: "People", description: "Explore the people and stories in the HUMAN:HERE archive." };

const logoLetters = "HUMAN:HERE".split("");

export default function PeoplePage() {
  return (
    <div className="spatial-page">
      <a className="spatial-skip" href="#people-panel">Skip to stories</a>

      <details className="spatial-menu">
        <summary>
          <span className="spatial-wordmark" aria-label="HUMAN:HERE">{logoLetters.map((letter, index) => <i key={`${letter}-${index}`}>{letter}</i>)}</span>
          <span className="spatial-menu__title">Menu <em>People</em></span>
          <span className="spatial-menu__toggle" aria-hidden="true" />
        </summary>
        <div className="spatial-menu__body">
          <section><h2>Explore</h2><nav><Link href="/">Home</Link><Link href="/about">About</Link><Link href="/people">People</Link></nav></section>
          <section><h2>Participate</h2><nav><Link href="/get-involved">Get involved</Link><Link href="/give">Give</Link><Link href="/contact">Contact</Link></nav></section>
        </div>
      </details>

      <div className="people-archive-map"><PeopleField /></div>

      <main className="people-archive-panel" id="people-panel">
        <article>
          <header className="people-panel__intro">
            <p>People</p>
            <h1>Every person carries a story.</h1>
          </header>

          <section className="people-panel__summary">
            <p>A name and a face can change the distance between us.</p>
            <p>Explore the field beside this page, or choose a story below.</p>
          </section>

          <section className="people-panel__section">
            <div className="people-panel__heading"><h2>Current stories</h2><span>{DEV_FIXTURE_PEOPLE.length} entries</span></div>
            <ul className="people-panel__list">
              {DEV_FIXTURE_PEOPLE.map((person, index) => (
                <li key={person.slug}>
                  <Link href={`/people/${person.slug}`}>
                    <span><small>{String(index + 1).padStart(2, "0")}</small><strong>{person.firstName}</strong><em>{person.descriptor}</em></span>
                    <span><small>{person.location}</small><b>Story</b></span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="people-panel__statement">
            <p>What we believe</p>
            <blockquote>People are more than what has happened to them.</blockquote>
          </section>

          <section className="people-panel__section">
            <div className="people-panel__heading"><h2>Enter the work</h2></div>
            <nav className="people-panel__actions"><Link href="/get-involved">Show up <span>↗</span></Link><Link href="/about">Read our belief <span>↗</span></Link><Link href="/contact">Start a conversation <span>↗</span></Link></nav>
          </section>

          <footer className="people-panel__footer"><p>HUMAN<span>:</span>HERE</p><nav><Link href="/">Home</Link><Link href="/give">Give</Link><Link href="/contact">Contact</Link></nav><small>Development stories. Final publication requires consent and approval.</small></footer>
        </article>
      </main>
      <span className="people-panel__handle" aria-hidden="true" />
    </div>
  );
}
