import Link from "next/link";
import { Suspense } from "react";
import { signInWithMagicLink, signInWithOAuth } from "./actions";
import { getAuthProviderAvailability } from "@/lib/auth/providers";

const AUTH_ERRORS: Record<string, string> = {
  provider: "That sign-in method is not supported.",
  "provider-unavailable": "That sign-in method is not available yet. Continue with email instead.",
  oauth: "We could not complete that sign-in. Please try again.",
  email: "Enter a valid email address.",
  "email-unavailable": "Email sign-in is temporarily unavailable.",
  "magic-link": "We could not send the sign-in link. Please try again.",
  callback: "That sign-in link could not be verified. Request a new one below.",
};

async function LoginContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const next = typeof query.next === "string" ? query.next : "/account";
  const sent = query.sent === "1";
  const error = typeof query.error === "string" ? AUTH_ERRORS[query.error] : undefined;
  const providers = await getAuthProviderAvailability();
  const hasSignInMethod = providers.email || providers.google || providers.apple;
  return (
    <main className="member-shell auth-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <nav aria-label="Public navigation"><Link href="/humans">Humans</Link><Link href="/mission">Mission</Link><Link href="/share">Share</Link></nav>
      </header>
      <section className="auth-composition" aria-labelledby="login-title">
        <div className="auth-intro">
          <p className="member-kicker"><i aria-hidden="true" /> My HUMAN:HERE</p>
          <h1 id="login-title">Come<br />as you<br />are.</h1>
          <p>Your private place to hold a draft, manage consent, and follow your story.</p>
        </div>
        <section className="auth-panel" aria-label="Account access">
          <header><span>Account access</span><small>Private · Secure</small></header>
          {error && <p className="auth-notice auth-error" role="alert">{error}</p>}
          {sent ? (
            <div className="auth-sent" role="status">
              <i aria-hidden="true" />
              <p className="eyebrow">Link sent</p>
              <h2>Check your email.</h2>
              <p>Your private sign-in link is on its way. It will return you to HUMAN:HERE.</p>
              <Link href="/">Return to the globe →</Link>
            </div>
          ) : (
            <div className="auth-methods">
              {providers.google && <form action={signInWithOAuth}><input type="hidden" name="provider" value="google" /><input type="hidden" name="next" value={next} /><button><span>Continue with Google</span><b aria-hidden="true">→</b></button></form>}
              {providers.apple && <form action={signInWithOAuth}><input type="hidden" name="provider" value="apple" /><input type="hidden" name="next" value={next} /><button><span>Continue with Apple</span><b aria-hidden="true">→</b></button></form>}
              {providers.email && <form action={signInWithMagicLink} className="auth-email"><label htmlFor="login-email">Email address</label><input id="login-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" /><input type="hidden" name="next" value={next} /><button>Send a private link <span aria-hidden="true">→</span></button></form>}
              {!hasSignInMethod && <p className="auth-notice" role="status">Account access is temporarily unavailable. You can still explore every public Human story.</p>}
            </div>
          )}
          <footer><span>No password required.</span><span>Nothing publishes automatically.</span></footer>
        </section>
      </section>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small>Browsing never requires an account.</small></footer>
    </main>
  );
}

export default function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <Suspense fallback={<main className="member-shell member-loading"><span>HUMAN<i>:</i>HERE</span><b>Opening your private space</b></main>}><LoginContent searchParams={searchParams} /></Suspense>;
}
