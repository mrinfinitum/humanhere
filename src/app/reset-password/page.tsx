import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { resetPassword } from "@/app/login/actions";

// The reset token travels in the URL, so never leak it through the Referer header.
export const metadata: Metadata = {
  title: "Set a new password",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

const PROBLEMS: Record<string, string> = {
  "password-short": "Use at least 10 characters for your password.",
  "password-long": "Use 128 characters or fewer for your password.",
  mismatch: "Those passwords do not match.",
  service: "We could not update your password right now. Please try again.",
};

type Query = Record<string, string | string[] | undefined>;

async function ResetContent({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  // Better Auth forwards the emailed link here as `?token=...`, or `?error=INVALID_TOKEN` when it is expired or used.
  const token = typeof query.token === "string" && query.token.length <= 512 ? query.token : "";
  const invalid = !token || typeof query.error === "string";
  const problem = typeof query.problem === "string" ? PROBLEMS[query.problem] : undefined;
  return (
    <main className="member-shell auth-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <nav aria-label="Public navigation"><Link href="/humans">Humans</Link><Link href="/mission">Mission</Link><Link href="/share">Share</Link></nav>
      </header>
      <section className="auth-composition" aria-labelledby="reset-title">
        <div className="auth-intro">
          <p className="member-kicker"><i aria-hidden="true" /> My HUMAN:HERE</p>
          <h1 id="reset-title">Start<br />fresh.</h1>
          <p>Choose a new password for your HUMAN:HERE account.</p>
        </div>
        <section className="auth-panel" aria-label="Set a new password">
          <header><span>New password</span><small>Private · Secure</small></header>
          {invalid ? (
            <div className="auth-methods">
              <p className="auth-notice auth-error" role="alert">This reset link is invalid or has expired. Request a new one.</p>
              <Link className="auth-text-link" href="/login?mode=forgot">Request a new reset link →</Link>
            </div>
          ) : (
            <div className="auth-methods">
              {problem && <p className="auth-notice auth-error" role="alert">{problem}</p>}
              <form action={resetPassword} className="auth-email auth-password">
                <input type="hidden" name="token" value={token} />
                <label htmlFor="reset-password">New password</label>
                <input id="reset-password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} aria-describedby="reset-password-hint" />
                <p id="reset-password-hint" className="auth-hint">At least 10 characters. A short phrase works well.</p>
                <label htmlFor="reset-confirm">Confirm new password</label>
                <input id="reset-confirm" name="confirm" type="password" autoComplete="new-password" required minLength={10} maxLength={128} />
                <button>Save new password <span aria-hidden="true">→</span></button>
              </form>
            </div>
          )}
          <footer><span>Your email is never shown publicly.</span><span>Nothing publishes automatically.</span></footer>
        </section>
      </section>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></small></footer>
    </main>
  );
}

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<Query> }) {
  return <Suspense fallback={<main className="member-shell member-loading"><span>HUMAN<i>:</i>HERE</span><b>Opening your private space</b></main>}><ResetContent searchParams={searchParams} /></Suspense>;
}
