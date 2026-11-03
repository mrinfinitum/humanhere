import Link from "next/link";
import { AccountLink } from "./AccountLink";

/** The site's main links, the same on every page. Staff also get an Admin link. */
export function SiteNav({ staff = false }: { staff?: boolean }) {
  return (
    <nav aria-label="Main navigation">
      <Link href="/humans">Humans</Link>
      <Link href="/members">People</Link>
      <Link href="/mission">Mission</Link>
      <Link href="/share">Share</Link>
      <Link href="/give">Give</Link>
      {staff && <Link className="member-admin-link" href="/admin">Admin</Link>}
      <AccountLink />
    </nav>
  );
}
