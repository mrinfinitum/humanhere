import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

/** The signed-in header shared by the profile and settings pages. */
export function MemberHeader({ role }: { role: string }) {
  return (
    <header className="member-header">
      <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
      <SiteNav staff={role !== "user"} signedIn />
    </header>
  );
}
