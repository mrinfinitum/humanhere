import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { signOut } from "@/app/login/actions";
import { safeNext } from "@/lib/auth/redirect";
import { requireUser } from "@/lib/auth/server";
import { acceptTerms } from "./actions";

type WelcomeSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function WelcomeContent({ searchParams }: { searchParams: WelcomeSearchParams }) {
  await connection();
  const query = await searchParams;
  const next = safeNext(query.next);
  await requireUser(next);
  return (
    <main className="member-shell auth-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <nav aria-label="Account navigation"><form action={signOut}><button>Sign out</button></form></nav>
      </header>
      <section className="auth-composition" aria-labelledby="welcome-title">
        <div className="auth-intro">
          <p className="member-kicker"><i aria-hidden="true" /> Before you begin</p>
          <h1 id="welcome-title">One<br />quick<br />thing.</h1>
          <p>Agreeing here does not publish anything. We ask separately every time you share a story.</p>
        </div>
        <section className="auth-panel" aria-label="Terms and privacy">
          <header><span>Terms and privacy</span><small>One time</small></header>
          {query.error === "required" && <p className="auth-notice auth-error" role="alert">Please tick both boxes to continue.</p>}
          <form action={acceptTerms} className="auth-agree">
            <input type="hidden" name="next" value={next} />
            <label><input type="checkbox" name="agree" required /><span>I agree to the <Link href="/terms" target="_blank">Terms of Use</Link> and have read the <Link href="/privacy" target="_blank">Privacy Policy</Link>.</span></label>
            <label><input type="checkbox" name="age" required /><span>I am 18 or older, or I have my parent or guardian&rsquo;s permission to use HUMAN:HERE.</span></label>
            <button>Agree and continue <span aria-hidden="true">→</span></button>
          </form>
          <footer><span>Nothing publishes automatically.</span><span>You can leave any time.</span></footer>
        </section>
      </section>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small>Browsing never requires an account.</small></footer>
    </main>
  );
}

export default function WelcomePage({ searchParams }: { searchParams: WelcomeSearchParams }) {
  return <Suspense fallback={<main className="member-shell member-loading"><span>HUMAN<i>:</i>HERE</span><b>Opening your private space</b></main>}><WelcomeContent searchParams={searchParams} /></Suspense>;
}
