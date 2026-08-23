import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { submissionRepository } from "@/lib/submissions/repository";
import { signOut } from "@/app/login/actions";
import { revokeConsent } from "./actions";

async function AccountContent() {
  await connection();
  const user = await requireUser("/account");
  const submissions = await submissionRepository.listOwned(user.id);
  return (
    <main className="account-page">
      <header><Link href="/">HUMAN<span>:</span>HERE</Link><form action={signOut}><button>Sign out</button></form></header>
      <section><p className="eyebrow">My HUMAN:HERE</p><h1>Your story stays yours.</h1><p>Draft privately. See what is under review. Change or revoke consent at any time.</p></section>
      <nav aria-label="Account sections"><a href="#stories">My story</a><a href="#consent">Consent</a><Link href="/remove-my-story">Remove story</Link></nav>
      <section id="stories" className="account-list"><div><h2>Stories</h2><Link href="/share">+ Begin a story</Link></div>
        {submissions.length ? submissions.map(item => <article key={item.id}><span>{item.status.replaceAll("_", " ")}</span><h3>{item.headline ?? item.publicName ?? "Untitled draft"}</h3><time dateTime={item.updatedAt}>Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.updatedAt))}</time>{item.status === "draft" && <Link href={`/share?draft=${item.id}`}>Continue →</Link>}{item.status === "published" && <form action={revokeConsent}><input type="hidden" name="submissionId" value={item.id} /><button>Revoke consent & unpublish</button></form>}</article>) : <p>No drafts yet. Nothing is public until review and explicit consent.</p>}
      </section>
      <section id="consent" className="account-consent"><p className="eyebrow">Consent</p><p>Publishing, media reuse, contact, and partner referrals are separate choices. You can revoke them without losing access to private help.</p></section>
    </main>
  );
}

export default function AccountPage() {
  return <Suspense fallback={<main className="account-page"><p>Opening My HUMAN:HERE…</p></main>}><AccountContent /></Suspense>;
}
