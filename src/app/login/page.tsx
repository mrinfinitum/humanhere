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
    <main className="auth-page">
      <Link className="auth-mark" href="/">HUMAN<span>:</span>HERE</Link>
      <section aria-labelledby="login-title">
        <p className="eyebrow">My HUMAN:HERE</p>
        <h1 id="login-title">Come as you are.</h1>
        <p>Sign in or create your private account to hold a draft, manage consent, or follow your story.</p>
        {error && <p className="auth-notice auth-error" role="alert">{error}</p>}
        {sent ? <p className="auth-notice" role="status">Check your email. Your private sign-in link is on its way.</p> : (
          <div className="auth-methods">
            {providers.google && <form action={signInWithOAuth}><input type="hidden" name="provider" value="google" /><input type="hidden" name="next" value={next} /><button>Continue with Google</button></form>}
            {providers.apple && <form action={signInWithOAuth}><input type="hidden" name="provider" value="apple" /><input type="hidden" name="next" value={next} /><button>Continue with Apple</button></form>}
            {providers.email && <form action={signInWithMagicLink} className="auth-email"><label htmlFor="login-email">Continue with Email</label><input id="login-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" /><input type="hidden" name="next" value={next} /><button>Send a magic link →</button></form>}
            {!hasSignInMethod && <p className="auth-notice" role="status">Account access is temporarily unavailable. You can still explore every public Human story.</p>}
          </div>
        )}
        <small>Browsing HUMAN:HERE never requires an account.</small>
      </section>
    </main>
  );
}

export default function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <Suspense fallback={<main className="auth-page"><p>Opening sign in…</p></main>}><LoginContent searchParams={searchParams} /></Suspense>;
}
