"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** "Sign in" for visitors, "Account" for members. Checked in the browser so public pages stay cached. */
export function AccountLink({ className }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/get-session", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then((body: { session?: unknown } | null) => setSignedIn(Boolean(body?.session)))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return <Link className={className} href={signedIn ? "/account" : "/login"}>{signedIn ? "Account" : "Sign in"}</Link>;
}
