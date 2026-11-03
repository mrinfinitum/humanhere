"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

const REMEMBERED = "hh:signed-in";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function signedInSnapshot() {
  try {
    return window.sessionStorage.getItem(REMEMBERED) === "1";
  } catch {
    return false;
  }
}

function remember(signedIn: boolean) {
  try {
    window.sessionStorage.setItem(REMEMBERED, signedIn ? "1" : "0");
  } catch {}
  for (const listener of listeners) listener();
}

/**
 * "Sign in" for visitors, "Account" for members. Checked in the browser so public
 * pages stay cached; the last answer is remembered for the tab so moving between
 * pages does not flash "Sign in" while the check runs.
 */
export function AccountLink({ className }: { className?: string }) {
  const signedIn = useSyncExternalStore(subscribe, signedInSnapshot, () => false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/get-session", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then((body: { session?: unknown } | null) => remember(Boolean(body?.session)))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return <Link className={className} href={signedIn ? "/account" : "/login"}>{signedIn ? "Account" : "Sign in"}</Link>;
}
