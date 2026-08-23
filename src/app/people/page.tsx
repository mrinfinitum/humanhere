import type { Metadata } from "next";
import Link from "next/link";
import { PeopleExperience } from "@/components/PeopleExperience";

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

      <PeopleExperience />
    </div>
  );
}
