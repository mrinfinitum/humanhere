import Image from "next/image";
import Link from "next/link";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

export function HumanField({ activeSlug }: { activeSlug?: string }) {
  return (
    <aside className="human-field" aria-label="People in the HUMAN:HERE archive">
      <div className="human-field__grid" aria-hidden="true" />
      <svg className="human-field__lines" viewBox="0 0 1000 900" preserveAspectRatio="none" aria-hidden="true">
        <path d="M160 180 L470 110 L735 265 L565 545 L830 720" />
        <path d="M470 110 L565 545 L245 705" />
        <circle cx="160" cy="180" r="4" /><circle cx="470" cy="110" r="4" /><circle cx="735" cy="265" r="4" /><circle cx="565" cy="545" r="4" /><circle cx="245" cy="705" r="4" /><circle cx="830" cy="720" r="4" />
      </svg>

      {DEV_FIXTURE_PEOPLE.map((person, index) => (
        <Link
          href={`/people/${person.slug}`}
          className={`human-fragment human-fragment--${index + 1} ${activeSlug === person.slug ? "is-active" : ""}`}
          key={person.slug}
        >
          <figure>
            <Image src={person.portrait} alt="" fill sizes="(max-width: 768px) 42vw, 280px" style={{ objectPosition: person.portraitPosition }} />
          </figure>
          <span className="human-fragment__name">{person.firstName}</span>
          <span className="human-fragment__type">Person</span>
        </Link>
      ))}

      {DEV_FIXTURE_PEOPLE.slice(0, 3).map((person, index) => (
        <Link href={`/people/${person.slug}`} className={`detail-fragment detail-fragment--${index + 1}`} key={`detail-${person.slug}`} aria-label={`A closer portrait of ${person.firstName}`}>
          <figure><Image src={person.portrait} alt="" fill sizes="160px" style={{ objectPosition: person.portraitPosition }} /></figure>
          <span>Portrait study · {person.firstName}</span>
        </Link>
      ))}

      <Link href="/about" className="text-fragment text-fragment--one">
        <small>Belief</small>
        <blockquote>Human connection cannot be automated.</blockquote>
        <span>HUMAN:HERE</span>
      </Link>
      <Link href="/get-involved" className="text-fragment text-fragment--two">
        <small>Invitation</small>
        <blockquote>Show up for someone.</blockquote>
        <span>Get involved</span>
      </Link>

      <div className="field-controls" aria-hidden="true"><span>+</span><i /><span>−</span></div>
    </aside>
  );
}
