import "server-only";

import { cache } from "react";
import { NeonPostgrestClient } from "@neondatabase/postgrest-js";
import { getNeonAuth } from "@/lib/auth/neon";
import { hasNeonAuthEnvironment } from "./env";
import { createPublicDatabaseClient } from "./public";
import type { Database } from "./database.types";

export const getSessionUser = cache(async () => {
  if (!hasNeonAuthEnvironment()) return null;
  const { data, error } = await getNeonAuth().getSession();
  if (error) throw new Error("Unable to verify your session. Please try again.");
  return data?.user ?? null;
});

// Diagnoses a token the database did not accept as a user, without logging it.
function describeToken(token: string) {
  try {
    const claims = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString()) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    return {
      role: claims.role,
      hasSubject: Boolean(claims.sub),
      expiresIn: typeof claims.exp === "number" ? claims.exp - now : null,
      issuedAgo: typeof claims.iat === "number" ? now - claims.iat : null,
    };
  } catch {
    return { unreadable: true };
  }
}

// For its first moments, a brand-new account's token is sometimes refused by
// the database, more often when several queries run at once. Every function
// refuses before it changes anything, so the request is retried briefly.
const AUTH_RETRY_DELAYS_MS = [300, 800, 1600];

async function fetchWithAuthRetry(input: RequestInfo | URL, init?: RequestInit) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(input, init);
    if (response.status !== 400 || attempt >= AUTH_RETRY_DELAYS_MS.length) return response;
    const body = await response.clone().text();
    if (!body.includes("P0001") || !body.includes("authentication required")) return response;
    console.warn(`Database refused a new session; retry ${attempt + 1}`);
    await new Promise(resolve => setTimeout(resolve, AUTH_RETRY_DELAYS_MS[attempt]));
  }
}

export const createDatabaseClient = cache(async () => {
  const user = await getSessionUser();
  if (!user) return createPublicDatabaseClient();
  const dataApiUrl = process.env.NEON_DATA_API_URL;
  if (!dataApiUrl) throw new Error("Neon Data API is not configured.");
  const { data, error } = await getNeonAuth().token();
  if (error || !data?.token) throw new Error("Unable to authorize database access.");
  const client = new NeonPostgrestClient<Database, "public">({
    dataApiUrl,
    options: { global: { fetch: fetchWithAuthRetry, headers: { Authorization: `Bearer ${data.token}` } } },
  });
  const profile = await client.rpc("ensure_profile", { p_display_name: user.name });
  if (profile.error) console.error("Profile initialization failed:", profile.error.code, profile.error.message, describeToken(data.token));
  if (profile.error) throw new Error(`Unable to initialize your account: ${profile.error.code}`);
  return client;
});
