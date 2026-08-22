import Link from "next/link";
import type { Person } from "@/data/people";

export function PersonNavigation({ previous, next }: { previous?: Person; next?: Person }) {
  return (
    <nav className="person-navigation" aria-label="More people">
      {previous ? <Link href={`/people/${previous.slug}`}>← Meet {previous.firstName}</Link> : <span />}
      {next ? <Link href={`/people/${next.slug}`}>Meet {next.firstName} →</Link> : <span />}
    </nav>
  );
}
