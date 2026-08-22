import Image from "next/image";
import Link from "next/link";
import type { Person } from "@/data/people";
import { PersonMetadata } from "./PersonMetadata";

export function FeaturedPerson({ person }: { person: Person }) {
  return (
    <section className="featured-person" aria-labelledby="featured-person-name">
      <div className="featured-person__portrait">
        <Image src={person.portrait} alt={person.portraitAlt} fill priority sizes="(max-width: 767px) 100vw, 68vw" style={{ objectPosition: person.portraitPosition }} />
      </div>
      <div className="featured-person__entry">
        <div><p className="archive-kicker">Featured person / Development fixture</p><h1 id="featured-person-name">{person.firstName}</h1></div>
        <PersonMetadata person={person} />
        {person.pullQuote && <blockquote>“{person.pullQuote}”</blockquote>}
        <Link className="text-link" href={`/people/${person.slug}`}>Read {person.firstName}&apos;s story <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
