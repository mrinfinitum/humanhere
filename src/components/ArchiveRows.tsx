import Link from "next/link";
import type { Person } from "@/data/people";

export function ArchiveRows({ people }: { people: Person[] }) {
  return (
    <div className="archive-table">
      <div className="archive-table__head" aria-hidden="true"><span>Name</span><span>Place</span><span>Kind</span></div>
      <ul>
        {people.map((person) => (
          <li key={person.slug}>
            <Link href={`/people/${person.slug}`}>
              <span><strong>{person.firstName}</strong>{person.shortStatement && <small>{person.shortStatement}</small>}</span>
              <span>{person.location ?? "—"}</span>
              <span>Story</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
