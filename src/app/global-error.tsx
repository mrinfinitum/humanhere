"use client";

// Replaces the root layout when it fails, so it carries its own styles and
// uses plain links: the app's components and fonts may be what broke.
const ink = "#f5f7fc";
const muted = "rgb(226 232 245 / .62)";
const glow = "#315dff";
const button = { display: "inline-flex", alignItems: "center", minHeight: 48, padding: "0 24px", borderRadius: 999, font: "inherit", fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", textDecoration: "none", cursor: "pointer" } as const;

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100svh", display: "grid", placeItems: "center", padding: 24, boxSizing: "border-box", background: "radial-gradient(circle at 78% 12%, rgb(48 70 165 / .28), transparent 46%), #05070b", color: ink, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", textAlign: "center" }}>
        <title>Something went wrong | HUMAN:HERE</title>
        <main style={{ maxWidth: 560 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 350, letterSpacing: ".31em" }}>HUMAN<span style={{ color: "#5074ff" }}>:</span>HERE</p>
          <h1 style={{ margin: "40px 0 16px", fontSize: "clamp(34px, 6vw, 60px)", fontWeight: 320, letterSpacing: ".04em", lineHeight: 1.02, textTransform: "uppercase" }}>Something went wrong.</h1>
          <p style={{ margin: 0, color: muted, fontSize: 17, lineHeight: 1.55 }}>It’s on our side, not yours. Nothing you shared was lost.</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 32 }}>
            <button type="button" onClick={() => retry()} style={{ ...button, border: `1px solid ${glow}`, background: glow, color: "#fff", boxShadow: "0 0 28px rgb(49 93 255 / .35)" }}>Try again</button>
            {/* A full page load, since client navigation depends on the layout that failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ ...button, border: "1px solid rgb(128 151 235 / .35)", color: ink }}>Go home</a>
          </div>
          {error.digest && <p style={{ marginTop: 28, color: "rgb(226 232 245 / .4)", fontSize: 12 }}>Reference {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
