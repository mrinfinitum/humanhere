"use client";

// Replaces the root layout when it fails, so it carries its own styles.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100svh", display: "grid", placeItems: "center", background: "#05070b", color: "#f5f7fc", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <title>Something went wrong | HUMAN:HERE</title>
        <main>
          <p style={{ margin: 0, color: "#9fb2ff", fontSize: 11, letterSpacing: ".3em", textTransform: "uppercase" }}>HUMAN:HERE</p>
          <h1 style={{ margin: "20px 0 14px", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 320, letterSpacing: ".04em", textTransform: "uppercase" }}>This page didn’t load.</h1>
          <p style={{ margin: 0, color: "rgb(226 232 245 / .62)" }}>It’s on our side, not yours. Nothing you shared was lost.</p>
          {error.digest && <p style={{ color: "rgb(226 232 245 / .4)", fontSize: 12 }}>Reference {error.digest}</p>}
          <button type="button" onClick={() => retry()} style={{ marginTop: 28, minHeight: 48, padding: "0 24px", border: 0, borderRadius: 999, background: "#315dff", color: "#fff", font: "inherit", fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", cursor: "pointer" }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
