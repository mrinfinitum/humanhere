import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getSiteUrl } from "../src/lib/supabase/env.ts";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalNodeEnv = process.env.NODE_ENV;

try {
  process.env.NODE_ENV = "development";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000/";
  assert.equal(getSiteUrl(), "http://localhost:3000", "localhost must remain available over HTTP");

  process.env.NEXT_PUBLIC_SITE_URL = "http://www.humanhere.co/path";
  assert.equal(getSiteUrl(), "https://www.humanhere.co", "remote callback origins must be canonical HTTPS origins");

  process.env.NEXT_PUBLIC_SITE_URL = "not-a-url";
  assert.throws(() => getSiteUrl(), /absolute URL/, "invalid callback origins must fail closed");
} finally {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
}

const providers = await readFile(new URL("../src/lib/auth/providers.ts", import.meta.url), "utf8");
assert.match(providers, /cache:\s*"no-store"/, "provider availability must not be frozen at build time");
assert.match(providers, /if \(!response\.ok\) return UNAVAILABLE/, "provider discovery must fail closed");

const actions = await readFile(new URL("../src/app/login/actions.ts", import.meta.url), "utf8");
assert.match(actions, /if \(!available\[value\]\)/, "OAuth actions must reject disabled providers server-side");
assert.match(actions, /if \(!available\.email\)/, "email actions must reject disabled email auth server-side");
assert.match(actions, /emailRedirectTo: `\$\{getSiteUrl\(\)\}\/auth\/callback/, "magic links must use the canonical callback origin");

const page = await readFile(new URL("../src/app/login/page.tsx", import.meta.url), "utf8");
assert.match(page, /providers\.google &&/, "Google must render only when enabled remotely");
assert.match(page, /providers\.apple &&/, "Apple must render only when enabled remotely");
assert.match(page, /providers\.email &&/, "email must render only when enabled remotely");

console.log("Auth launch safeguards verified: fail-closed providers, server-side enforcement, and canonical HTTPS callbacks.");
