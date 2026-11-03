import "server-only";

import { headers } from "next/headers";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Turnstile runs only when both keys are set, so local development works without it. */
export function turnstileSiteKey() {
  return process.env.TURNSTILE_SECRET_KEY ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null : null;
}

/** Checks the challenge a sign-in or sign-up form submitted with Cloudflare. */
export async function passesTurnstile(formData: FormData) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  const token = formData.get("cf-turnstile-response");
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const requestHeaders = await headers();
  const ip = requestHeaders.get("cf-connecting-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(8000) });
    const result = await response.json() as { success?: boolean; "error-codes"?: string[] };
    if (!result.success) console.error("Turnstile rejected a sign-in:", result["error-codes"]?.join(",") ?? "unknown");
    return result.success === true;
  } catch {
    console.error("Turnstile could not be reached.");
    return false;
  }
}
