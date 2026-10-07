import "server-only";

import { NeonPostgrestClient, fetchWithToken } from "@neondatabase/postgrest-js";
import type { Database } from "./database.types";

// No cookies or visitor session: public cache entries cannot inherit privileges.
async function getAnonymousToken() {
  const base = process.env.NEON_AUTH_BASE_URL;
  if (!base) throw new Error("Neon Auth is not configured.");
  const response = await fetch(`${base.replace(/\/$/, "")}/token/anonymous`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Could not obtain public database access.");
  const data = await response.json() as { token?: string };
  if (!data.token) throw new Error("Missing anonymous database token.");
  return data.token;
}

export function createPublicDatabaseClient() {
  const dataApiUrl = process.env.NEON_DATA_API_URL;
  if (!dataApiUrl) throw new Error("Neon Data API is not configured.");
  return new NeonPostgrestClient<Database, "public">({
    dataApiUrl,
    options: { global: { fetch: fetchWithToken(getAnonymousToken) } },
  });
}
