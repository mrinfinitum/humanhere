import Link from "next/link";
import { AccountLink } from "./AccountLink";

/**
 * The site's main links, the same on every page. Staff also get an Admin link.
 * Pages that already know the visitor is signed in say so, and skip the browser check.
 */
export function SiteNav({ staff = false, signedIn = false }: { staff?: boolean; signedIn?: boolean }) {
  return (
    <nav aria-label="Main navigation">
      <Link href="/world">Humans</Link>
      <Link href="/mission">Mission</Link>
      <Link href="/share">Tell your story</Link>
      <Link href="/give">Give</Link>
      {staff && <Link className="member-admin-link" href="/admin">Admin</Link>}
      {signedIn ? <Link href="/account">Account</Link> : <AccountLink />}
    </nav>
  );
}
