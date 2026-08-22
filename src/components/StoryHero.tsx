import Image from "next/image";
import type { Person } from "@/data/people";
import { PersonMetadata } from "./PersonMetadata";

export function StoryHero({ person }: { person: Person }) {
  return (
    <header className="story-hero">
      <div className="story-hero__title"><p>Human archive / Development fixture</p><h1>{person.firstName}<span>.</span></h1></div>
      <div className="story-hero__details"><PersonMetadata person={person} includeCredit />{person.pullQuote && <blockquote>“{person.pullQuote}”</blockquote>}</div>
      <div className="story-hero__image">
        <Image src={person.portrait} alt={person.portraitAlt} fill priority sizes="100vw" style={{ objectPosition: person.portraitPosition }} />
      </div>
    </header>
  );
}
