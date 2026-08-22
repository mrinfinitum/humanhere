import type { Person } from "@/data/people";
import { PortraitItem } from "./PortraitItem";

export function PortraitField({ people, heading = "People", showIntro = true }: { people: Person[]; heading?: string; showIntro?: boolean }) {
  return (
    <section className="portrait-field" aria-labelledby={showIntro ? "portrait-field-heading" : undefined}>
      {showIntro && (
        <header className="portrait-field__intro">
          <h2 id="portrait-field-heading">{heading}<span>.</span></h2>
          <p>Every face leads to a story.</p>
          <p className="archive-count">Archive / {String(people.length).padStart(2, "0")} entries</p>
        </header>
      )}
      <div className="portrait-field__grid">
        {people.map((person, index) => <PortraitItem key={person.slug} person={person} index={index} headingLevel={showIntro ? "h3" : "h2"} />)}
      </div>
    </section>
  );
}
