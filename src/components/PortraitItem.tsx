import Image from "next/image";
import Link from "next/link";
import type { Person } from "@/data/people";

export function PortraitItem({ person, index, headingLevel = "h3" }: { person: Person; index: number; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;

  return (
    <article className={`portrait-item portrait-item--${index + 1}`}>
      <Link href={`/people/${person.slug}`} aria-label={`Meet ${person.firstName}`}>
        <div className="portrait-item__image">
          <Image src={person.portrait} alt={person.portraitAlt} fill sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 45vw" style={{ objectPosition: person.portraitPosition }} />
        </div>
        <div className="portrait-item__caption">
          <div><Heading>{person.firstName}</Heading>{person.location && <p>{person.location}</p>}</div>
          <span>Meet {person.firstName} ↗</span>
        </div>
      </Link>
    </article>
  );
}
