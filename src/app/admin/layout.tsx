import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/server";
import { AdminNav } from "@/components/admin/AdminNav";

function AdminFrame({ role, children }: { role?: string; children: ReactNode }) {
  return <main className="member-shell admin-shell">
    <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
    <header className="member-header">
      <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
      <nav aria-label="Staff">{role && <span className="admin-role">{role}</span>}<Link href="/account">Account</Link></nav>
    </header>
    {role && <AdminNav />}
    <div className="admin-body">{children}</div>
  </main>;
}

async function AdminGate({ children }: { children: ReactNode }) {
  await connection();
  const { role } = await requireStaff();
  return <AdminFrame role={role}>{children}</AdminFrame>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<AdminFrame><p className="admin-checking">Checking staff access…</p></AdminFrame>}><AdminGate>{children}</AdminGate></Suspense>;
}
