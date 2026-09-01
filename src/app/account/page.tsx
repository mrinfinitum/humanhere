import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getAccountRole, requireUser } from "@/lib/auth/server";
import { submissionRepository } from "@/lib/submissions/repository";
import { signOut } from "@/app/login/actions";
import { revokeConsent } from "./actions";

async function AccountContent() {
  await connection();
  const user = await requireUser("/account");
  const [submissions, role] = await Promise.all([
    submissionRepository.listOwned(user.id),
    getAccountRole(user.id),
  ]);
  const draftCount = submissions.filter(item => item.status === "draft").length;
  const publishedCount = submissions.filter(item => item.status === "published").length;
  const isStaff = role !== "user";
  return (
    <main className="member-shell account-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <nav aria-label="Account navigation"><Link href="/humans">Humans</Link>{isStaff && <Link className="member-admin-link" href="/admin">Admin</Link>}<form action={signOut}><button>Sign out</button></form></nav>
      </header>
      <section className="account-hero">
        <div>
          <p className="member-kicker"><i aria-hidden="true" /> My HUMAN:HERE</p>
          <h1>Your story<br />stays yours.</h1>
        </div>
        <aside aria-label="Account summary">
          <p>{user.email}</p>
          <dl><div><dt>Stories</dt><dd>{submissions.length.toString().padStart(2, "0")}</dd></div><div><dt>Private drafts</dt><dd>{draftCount.toString().padStart(2, "0")}</dd></div><div><dt>Published</dt><dd>{publishedCount.toString().padStart(2, "0")}</dd></div></dl>
          <small>{isStaff ? `${role} access` : "Private member"}</small>
        </aside>
      </section>
      <nav className="account-section-nav" aria-label="Account sections"><a href="#stories">My stories</a><a href="#consent">Consent</a><Link href="/remove-my-story">Remove a story</Link></nav>
      <section id="stories" className="account-list"><header><div><p className="eyebrow">Your presence</p><h2>Stories</h2></div><Link href="/share"><span>Begin a story</span><b aria-hidden="true">+</b></Link></header>
        {submissions.length ? <div className="account-story-list">{submissions.map((item, index) => <article key={item.id}><span className="account-story-index">{String(index + 1).padStart(2, "0")}</span><div><span className={`account-status account-status--${item.status}`}>{item.status.replaceAll("_", " ")}</span><h3>{item.headline ?? item.publicName ?? "Untitled draft"}</h3></div><time dateTime={item.updatedAt}>Updated<br />{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.updatedAt))}</time><div className="account-story-action">{item.status === "draft" && <Link href={`/share?draft=${item.id}`}>Continue →</Link>}{item.status === "published" && <form action={revokeConsent}><input type="hidden" name="submissionId" value={item.id} /><button>Revoke consent & unpublish</button></form>}</div></article>)}</div> : <div className="account-empty"><i aria-hidden="true" /><p>Nothing here yet.</p><h3>When you are ready,<br />there is room for you.</h3><span>Nothing becomes public without review and explicit consent.</span><Link href="/share">Begin privately →</Link></div>}
      </section>
      <section id="consent" className="account-consent"><div><p className="eyebrow">Your choices</p><h2>Consent is never assumed.</h2></div><p>Publishing, media reuse, contact, and partner referrals are separate choices. You can revoke them without losing access to private help.</p><Link href="/remove-my-story">Change or remove a story →</Link></section>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small>Your private space · Your choices</small></footer>
    </main>
  );
}

export default function AccountPage() {
  return <Suspense fallback={<main className="member-shell member-loading"><span>HUMAN<i>:</i>HERE</span><b>Opening My HUMAN:HERE</b></main>}><AccountContent /></Suspense>;
}
