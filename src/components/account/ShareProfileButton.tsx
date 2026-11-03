"use client";

import { useState } from "react";

/** Opens the device share sheet, or copies the profile link where there is none. */
export function ShareProfileButton({ username, className }: { username: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}/@${username}`;
    if (navigator.share) {
      await navigator.share({ title: `@${username} on HUMAN:HERE`, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }
  return <button type="button" className={className} onClick={share} aria-live="polite">{copied ? "Link copied" : "Share profile"}</button>;
}
