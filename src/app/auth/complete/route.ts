import { connection } from "next/server";
import { getNeonAuth } from "@/lib/auth/neon";
import { safeNext } from "@/lib/auth/redirect";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { getSiteUrl } from "@/lib/neon/env";

const VERIFIER = "neon_auth_session_verifier";

// The SDK middleware only exchanges a verifier when the browser also holds a
// session challenge cookie, which an emailed link never has. Exchange it here
// through the auth handler, which sets the session cookies on the redirect.
async function exchangeVerifier(request: Request, verifier: string) {
  const exchange = new URL("/api/auth/get-session", getSiteUrl());
  exchange.searchParams.set(VERIFIER, verifier);
  const headers = new Headers(request.headers);
  headers.set("origin", getSiteUrl());
  const response = await getNeonAuth().handler().GET(new Request(exchange, { headers }), {
    params: Promise.resolve({ path: ["get-session"] }),
  });
  const body = response.ok ? await response.json().catch(() => null) as { session?: unknown } | null : null;
  return body?.session ? response.headers.getSetCookie() : null;
}

export async function GET(request: Request) {
  await connection();
  const { searchParams } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const verifier = searchParams.get(VERIFIER);
  const headers = new Headers({ "Cache-Control": "no-store" });
  let signedIn = false;
  if (verifier) {
    const cookies = await exchangeVerifier(request, verifier).catch(() => null);
    signedIn = cookies !== null;
    for (const cookie of cookies ?? []) headers.append("Set-Cookie", cookie);
  } else {
    signedIn = Boolean(await getAuthenticatedUser());
  }
  headers.set("Location", `${getSiteUrl()}${signedIn ? next : `/login?error=callback&next=${encodeURIComponent(next)}`}`);
  return new Response(null, { status: 303, headers });
}
