import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { signOut } from "@/app/login/actions";
import { safeNext } from "@/lib/auth/redirect";
import { requireUser } from "@/lib/auth/server";
import { createDatabaseClient } from "@/lib/neon/server";
import { acceptTerms } from "./actions";

const WELCOME_ERRORS: Record<string, string> = {
  "username-invalid": "Usernames are 3 to 20 letters, numbers or underscores.",
  "username-reserved": "That username is reserved. Try another.",
  "username-taken": "That username is taken. Try another.",
};

type WelcomeSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function WelcomeContent({ searchParams }: { searchParams: WelcomeSearchParams }) {
  await connection();
  const query = await searchParams;
  const next = safeNext(query.next);
  const user = await requireUser(next);
  const { data: profile } = await (await createDatabaseClient()).from("profiles").select("username,display_name,bio").eq("id", user.id).maybeSingle();
  // Members who already set up a profile only need to agree to updated terms.
  const returning = Boolean(profile?.username);
  const suggested = profile?.username ?? (user.email.split("@")[0] ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  return (
    <main className="member-shell auth-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <nav aria-label="Account navigation"><form action={signOut}><button>Sign out</button></form></nav>
      </header>
      <section className="auth-composition" aria-labelledby="welcome-title">
        <div className="auth-intro">
          <p className="member-kicker"><i aria-hidden="true" /> {returning ? "We updated our terms" : "Before you begin"}</p>
          <h1 id="welcome-title">{returning ? <>A few<br />things<br />changed.</> : <>Make<br />it<br />yours.</>}</h1>
          {returning
            ? <p>You can now add a profile photo, and signed-in members can see who follows you and who you follow. You can hide those lists any time in Settings, Privacy &amp; sharing. Please review your profile and agree to continue.</p>
            : <p>Choose how you appear on HUMAN:HERE. Drafts stay private until you share them, and you can change all of this later.</p>}
        </div>
        <section className="auth-panel" aria-label="Your profile">
          <header><span>Your profile</span><small>{returning ? "Updated terms" : "One time"}</small></header>
          {typeof query.error === "string" && WELCOME_ERRORS[query.error] && <p className="auth-notice auth-error" role="alert">{WELCOME_ERRORS[query.error]}</p>}
          <form action={acceptTerms} className="auth-agree">
            <input type="hidden" name="next" value={next} />
            <div className="auth-username">
              <label htmlFor="welcome-username">Choose your @username</label>
              <div><span aria-hidden="true">@</span><input id="welcome-username" name="username" defaultValue={suggested} required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" autoComplete="username" /></div>
              <small>3 to 20 letters, numbers or underscores. You can change it later.</small>
            </div>
            <div className="auth-username auth-field">
              <label htmlFor="welcome-name">Name</label>
              <input id="welcome-name" name="displayName" defaultValue={profile?.display_name ?? user.name ?? ""} maxLength={80} autoComplete="name" placeholder="How people see you" />
            </div>
            <div className="auth-username auth-field">
              <label htmlFor="welcome-bio">Bio <small>Optional</small></label>
              <textarea id="welcome-bio" name="bio" defaultValue={profile?.bio ?? ""} maxLength={160} rows={2} placeholder="A line about you" />
            </div>
            <p className="auth-consent">{returning && <>Read what changed in the <Link href="/privacy" target="_blank">Privacy Policy</Link>. </>}By continuing you agree to the <Link href="/terms" target="_blank">Terms of Use</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>, and confirm you are 18 or older or have a parent or guardian&rsquo;s permission.</p>
            <button>Continue <span aria-hidden="true">→</span></button>
          </form>
          <footer><span>Drafts stay private.</span><span>You can leave any time.</span></footer>
        </section>
      </section>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small>Browsing never requires an account.</small></footer>
    </main>
  );
}

export default function WelcomePage({ searchParams }: { searchParams: WelcomeSearchParams }) {
  return <Suspense fallback={<main className="member-shell member-loading"><span>HUMAN<i>:</i>HERE</span><b>Opening your private space</b></main>}><WelcomeContent searchParams={searchParams} /></Suspense>;
}
