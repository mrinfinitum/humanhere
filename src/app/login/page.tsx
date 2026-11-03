import Link from "next/link";
import { Suspense } from "react";
import { requestPasswordReset, signInWithMagicLink, signInWithOAuth, signInWithPassword, signUpWithPassword } from "./actions";
import { getAuthProviderAvailability } from "@/lib/auth/providers";
import { safeNext } from "@/lib/auth/redirect";

const AUTH_ERRORS: Record<string, string> = {
  provider: "That sign-in method is not supported.",
  "provider-unavailable": "That sign-in method is not available yet. Continue with email instead.",
  oauth: "We could not complete that sign-in. Please try again.",
  email: "Enter a valid email address.",
  "email-unavailable": "Email links are temporarily unavailable.",
  "magic-link": "We could not send the sign-in link. Please try again.",
  callback: "That sign-in link could not be verified. Request a new one below.",
  "password-unavailable": "Password sign-in is not available yet.",
  credentials: "That email and password do not match. Try again or reset your password.",
  unverified: "Confirm your email address first. Check your inbox for the verification link.",
  "rate-limit": "Too many attempts. Wait a minute and try again.",
  "password-service": "We could not sign you in right now. Please try again.",
  "password-short": "Use at least 10 characters for your password.",
  "password-long": "Use 128 characters or fewer for your password.",
  "account-exists": "We could not create that account. If you already have one, sign in or reset your password.",
  signup: "We could not create your account. Please try again.",
};

type Mode = "signin" | "signup" | "forgot";
type Query = Record<string, string | string[] | undefined>;

function modeHref(mode: Mode, next: string) {
  const query = new URLSearchParams();
  if (mode !== "signin") query.set("mode", mode);
  if (next !== "/account") query.set("next", next);
  const text = query.toString();
  return text ? `/login?${text}` : "/login";
}

function SentNotice({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="auth-sent" role="status">
      <i aria-hidden="true" />
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{children}</p>
      <Link href="/">Return to the globe →</Link>
    </div>
  );
}

function MagicLinkForm({ next }: { next: string }) {
  return (
    <form action={signInWithMagicLink} className="auth-email">
      <label htmlFor="magic-email">Email address</label>
      <input id="magic-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      <input type="hidden" name="next" value={next} />
      <button>Send a private link <span aria-hidden="true">→</span></button>
    </form>
  );
}

async function LoginContent({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const next = safeNext(query.next);
  const mode: Mode = query.mode === "signup" || query.mode === "forgot" ? query.mode : "signin";
  const error = typeof query.error === "string" ? AUTH_ERRORS[query.error] : undefined;
  const providers = await getAuthProviderAvailability();
  const hasOAuth = providers.google || providers.apple;
  const hasSignInMethod = providers.email || providers.password || hasOAuth;
  const resetDone = query.reset === "1";

  let notice: React.ReactNode = null;
  if (query.sent === "1") {
    notice = <SentNotice eyebrow="Link sent" title="Check your email.">Your private sign-in link is on its way. It will return you to HUMAN:HERE.</SentNotice>;
  } else if (query.verify === "1") {
    notice = <SentNotice eyebrow="Almost there" title="Confirm your email.">We sent a verification link. Open it to finish creating your account.</SentNotice>;
  } else if (query.reset === "sent") {
    notice = <SentNotice eyebrow="Check your inbox" title="Reset link on its way.">If an account exists for that email, we sent a link to set a new password. It expires soon, so use it shortly.</SentNotice>;
  }

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
          <header><span>{providers.password && mode === "signup" ? "Create account" : providers.password && mode === "forgot" ? "Reset password" : "Account access"}</span><small>Private · Secure</small></header>
          {error && <p className="auth-notice auth-error" role="alert">{error}</p>}
          {resetDone && !error && <p className="auth-notice" role="status">Your password was updated. Sign in with your new password.</p>}
          {notice ?? (
            <div className="auth-methods">
              {mode === "forgot" && providers.password ? (
                <form action={requestPasswordReset} className="auth-email auth-password" aria-describedby="forgot-hint">
                  <p id="forgot-hint" className="auth-hint">Enter your account email. If it matches an account, we will send a link to set a new password.</p>
                  <label htmlFor="forgot-email">Email address</label>
                  <input id="forgot-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
                  <input type="hidden" name="next" value={next} />
                  <button>Send reset link <span aria-hidden="true">→</span></button>
                  <Link className="auth-text-link" href={modeHref("signin", next)}>← Back to sign in</Link>
                </form>
              ) : (
                <>
                  {hasOAuth && (
                    <div className="auth-providers">
                      {providers.google && <form action={signInWithOAuth}><input type="hidden" name="provider" value="google" /><input type="hidden" name="next" value={next} /><button><span>Continue with Google</span><b aria-hidden="true">→</b></button></form>}
                      {providers.apple && <form action={signInWithOAuth}><input type="hidden" name="provider" value="apple" /><input type="hidden" name="next" value={next} /><button><span>Continue with Apple</span><b aria-hidden="true">→</b></button></form>}
                    </div>
                  )}
                  {providers.password && (
                    <>
                      {hasOAuth && <p className="auth-divider"><span>or use email</span></p>}
                      <nav className="auth-modes" aria-label="Choose account action">
                        <Link href={modeHref("signin", next)} aria-current={mode === "signin" ? "page" : undefined}>Sign in</Link>
                        <Link href={modeHref("signup", next)} aria-current={mode === "signup" ? "page" : undefined}>Create account</Link>
                      </nav>
                      {mode === "signup" ? (
                        <form action={signUpWithPassword} className="auth-email auth-password">
                          <label htmlFor="signup-name">Name <small>(optional)</small></label>
                          <input id="signup-name" name="name" type="text" autoComplete="name" maxLength={80} placeholder="What should we call you?" />
                          <label htmlFor="signup-email">Email address</label>
                          <input id="signup-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
                          <label htmlFor="signup-password">Password</label>
                          <input id="signup-password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} aria-describedby="signup-password-hint" />
                          <p id="signup-password-hint" className="auth-hint">At least 10 characters. A short phrase works well.</p>
                          <input type="hidden" name="next" value={next} />
                          <button>Create account <span aria-hidden="true">→</span></button>
                        </form>
                      ) : (
                        <form action={signInWithPassword} className="auth-email auth-password">
                          <label htmlFor="signin-email">Email address</label>
                          <input id="signin-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
                          <span className="auth-label-row">
                            <label htmlFor="signin-password">Password</label>
                            <Link className="auth-text-link" href={modeHref("forgot", next)}>Forgot password?</Link>
                          </span>
                          <input id="signin-password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
                          <input type="hidden" name="next" value={next} />
                          <button>Sign in <span aria-hidden="true">→</span></button>
                        </form>
                      )}
                    </>
                  )}
                  {providers.email && (providers.password ? (
                    <details className="auth-alt">
                      <summary>Email me a link instead</summary>
                      <MagicLinkForm next={next} />
                    </details>
                  ) : (
                    <MagicLinkForm next={next} />
                  ))}
                  {mode === "forgot" && !providers.password && <p className="auth-notice" role="status">Password reset is not available yet.{providers.email ? " Use a private email link instead." : ""}</p>}
                  {!hasSignInMethod && <p className="auth-notice" role="status">Account access is temporarily unavailable. You can still explore every public Human story.</p>}
                </>
              )}
            </div>
          )}
          <footer><span>Your email is never shown publicly.</span><span>Nothing publishes automatically.</span></footer>
        </section>
      </section>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></small></footer>
    </main>
  );
}

export default function LoginPage({ searchParams }: { searchParams: Promise<Query> }) {
  return <Suspense fallback={<main className="member-shell member-loading"><span>HUMAN<i>:</i>HERE</span><b>Opening your private space</b></main>}><LoginContent searchParams={searchParams} /></Suspense>;
}
