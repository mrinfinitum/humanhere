import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/server";

async function AdminGate({ children }: { children: ReactNode }) {
  await connection();
  const { role } = await requireStaff();
  return <main className="admin-shell"><header><Link href="/">HUMAN<span>:</span>HERE</Link><b>{role}</b></header><nav aria-label="Admin"><Link href="/admin/submissions">Submissions</Link><Link href="/admin/social">Social</Link><Link href="/admin/consent">Consent</Link><Link href="/admin/removal-requests">Removal requests</Link></nav>{children}</main>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<main className="admin-shell"><p>Checking staff access…</p></main>}><AdminGate>{children}</AdminGate></Suspense>;
}
