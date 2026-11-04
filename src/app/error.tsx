"use client";

import Link from "next/link";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="member-shell give-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
      </header>
      <section className="give-hero" aria-labelledby="error-title">
        <p className="member-kicker"><i aria-hidden="true" /> Something went wrong</p>
        <h1 id="error-title">This page<br /><em>didn’t load.</em></h1>
        <div className="give-hero__copy">
          <p>It’s on our side, not yours. Nothing you shared was lost. Try again, or head back home.</p>
          {error.digest && <small>Reference {error.digest}</small>}
          <div className="give-buttons">
            <button type="button" className="give-button give-button--primary" onClick={() => retry()}>Try again</button>
            <Link className="give-button" href="/">Go home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
