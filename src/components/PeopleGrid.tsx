import Image from "next/image";
import Link from "next/link";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

export function PeopleGrid({ limit }: { limit?: number }) {
  const people = typeof limit === "number" ? DEV_FIXTURE_PEOPLE.slice(0, limit) : DEV_FIXTURE_PEOPLE;
  return (
    <div className="people-grid">
      {people.map((person) => (
        <Link href={`/people/${person.slug}`} className="person-card" key={person.slug}>
          <figure><Image src={person.portrait} alt={person.portraitAlt} fill sizes="(max-width: 700px) 100vw, 50vw" style={{ objectPosition: person.portraitPosition }} /></figure>
          <div><p>{person.location}</p><h3>{person.firstName}</h3><span>{person.descriptor}</span><b aria-hidden="true">↗</b></div>
        </Link>
      ))}
    </div>
  );
}
