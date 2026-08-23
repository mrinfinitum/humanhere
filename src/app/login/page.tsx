import Link from "next/link";
import { Suspense } from "react";
import { signInWithMagicLink, signInWithOAuth } from "./actions";

async function LoginContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const next = typeof query.next === "string" ? query.next : "/account";
  const sent = query.sent === "1";
  return (
    <main className="auth-page">
      <Link className="auth-mark" href="/">HUMAN<span>:</span>HERE</Link>
      <section aria-labelledby="login-title">
        <p className="eyebrow">My HUMAN:HERE</p>
        <h1 id="login-title">Come as you are.</h1>
        <p>Sign in to hold a private draft, manage consent, or follow your story.</p>
        {sent ? <p className="auth-notice" role="status">Check your email. Your private sign-in link is on its way.</p> : (
          <div className="auth-methods">
            <form action={signInWithOAuth}><input type="hidden" name="provider" value="google" /><input type="hidden" name="next" value={next} /><button>Continue with Google</button></form>
            <form action={signInWithOAuth}><input type="hidden" name="provider" value="apple" /><input type="hidden" name="next" value={next} /><button>Continue with Apple</button></form>
            <form action={signInWithMagicLink} className="auth-email"><label htmlFor="login-email">Continue with Email</label><input id="login-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" /><input type="hidden" name="next" value={next} /><button>Send a magic link →</button></form>
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
