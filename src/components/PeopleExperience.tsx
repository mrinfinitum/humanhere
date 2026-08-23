"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";
import { PeopleField } from "@/components/PeopleField";

export function PeopleExperience() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [nudged, setNudged] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const active = activeIndex == null ? null : DEV_FIXTURE_PEOPLE[activeIndex];

  useEffect(() => {
    document.body.classList.toggle("people-panel-nudged", nudged);
    return () => document.body.classList.remove("people-panel-nudged");
  }, [nudged]);

  const select = (index: number) => {
    setActiveIndex(index);
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`people-experience ${nudged ? "is-nudged" : ""}`}>
      <div className="people-archive-map"><PeopleField activeIndex={activeIndex} onSelect={select} /></div>

      <main ref={panelRef} className="people-archive-panel" id="people-panel">
        <article className={active ? "is-story" : "is-index"}>
          {active ? <>
            <header className="people-panel__story-head">
              <p>Story · {active.location}</p>
              <h1>{active.firstName}</h1>
              <span>{active.descriptor}</span>
            </header>
            <figure className="people-panel__story-image"><Image src={active.portrait} alt={active.portraitAlt} fill sizes="480px" style={{ objectPosition: active.portraitPosition }} /></figure>
            <section className="people-panel__story-copy"><blockquote>{active.pullQuote}</blockquote><p>{active.story}</p><p>Every published story will be developed through consent, conversation, and collaborative review with the person represented.</p></section>
            <nav className="people-panel__story-actions"><Link href={`/people/${active.slug}`}>Read the full story <span>↗</span></Link><button type="button" onClick={() => setActiveIndex(null)}>Return to the archive <span>←</span></button></nav>
          </> : <>
            <header className="people-panel__intro"><p>People</p><h1>Every person carries a story.</h1></header>
            <section className="people-panel__summary"><p>A name and a face can change the distance between us.</p><p>Explore the field beside this page, or choose a story below.</p></section>
            <section className="people-panel__section"><div className="people-panel__heading"><h2>Current stories</h2><span>{DEV_FIXTURE_PEOPLE.length} entries</span></div><ul className="people-panel__list">{DEV_FIXTURE_PEOPLE.map((person, index) => <li key={person.slug}><button type="button" onClick={() => select(index)}><span><small>{String(index + 1).padStart(2, "0")}</small><strong>{person.firstName}</strong><em>{person.descriptor}</em></span><span><small>{person.location}</small><b>Story</b></span></button></li>)}</ul></section>
            <section className="people-panel__statement"><p>What we believe</p><blockquote>People are more than what has happened to them.</blockquote></section>
            <section className="people-panel__section"><div className="people-panel__heading"><h2>Enter the work</h2></div><nav className="people-panel__actions"><Link href="/get-involved">Show up <span>↗</span></Link><Link href="/about">Read our belief <span>↗</span></Link><Link href="/contact">Start a conversation <span>↗</span></Link></nav></section>
          </>}
          <footer className="people-panel__footer"><p>HUMAN<span>:</span>HERE</p><nav><Link href="/">Home</Link><Link href="/give">Give</Link><Link href="/contact">Contact</Link></nav><small>Development stories. Final publication requires consent and approval.</small></footer>
        </article>
      </main>
      <button type="button" className="people-panel__handle" onClick={() => setNudged(value => !value)} aria-label={nudged ? "Open story panel" : "Expand map"}><i /><span>{nudged ? "Open" : "Map"}</span></button>
    </div>
  );
}
