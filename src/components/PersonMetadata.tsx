import type { Person } from "@/data/people";

export function PersonMetadata({ person, includeCredit = false }: { person: Person; includeCredit?: boolean }) {
  return (
    <dl className="person-metadata">
      {person.location && <div><dt>Place</dt><dd>{person.location}</dd></div>}
      {person.publishedAt && <div><dt>Year</dt><dd>{person.publishedAt}</dd></div>}
      {includeCredit && person.photographer && <div><dt>Image</dt><dd>{person.photographer}</dd></div>}
    </dl>
  );
}
