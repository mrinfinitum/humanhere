"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/admin/reports", "Reports"],
  ["/admin/submissions", "Submissions"],
  ["/admin/social", "Social"],
  ["/admin/consent", "Consent"],
  ["/admin/removal-requests", "Removal requests"],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return <nav className="admin-tabs" aria-label="Admin">{LINKS.map(([href, label]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}>{label}</Link>)}</nav>;
}
