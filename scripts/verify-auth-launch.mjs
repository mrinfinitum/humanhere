import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { safeNext } from "../src/lib/auth/redirect.ts";
import { getSiteUrl } from "../src/lib/neon/env.ts";

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

for (const path of ["https://evil.test", "//evil.test", "/\\evil.test", "/\n/evil.test", null]) {
  assert.equal(safeNext(path), "/account", "untrusted login redirects must stay on site");
}
assert.equal(safeNext("/share?draft=123"), "/share?draft=123");

const providers = await readFile(new URL("../src/lib/auth/providers.ts", import.meta.url), "utf8");
assert.match(providers, /NEON_AUTH_MAGIC_LINK_ENABLED === "true"/, "magic links must require explicit configuration");
assert.match(providers, /NEON_AUTH_GOOGLE_ENABLED === "true"/, "Google must require explicit configuration");
const actions = await readFile(new URL("../src/app/login/actions.ts", import.meta.url), "utf8");
assert.match(actions, /if \(!available\[value\]\)/, "OAuth actions must reject disabled providers server-side");
assert.match(actions, /if \(!available\.email\)/, "email actions must reject disabled email auth server-side");
assert.match(actions, /callbackURL: `\$\{getSiteUrl\(\)\}\/auth\/complete\?next=/, "sign-in must pass through the session exchange before returning to public pages");
const page = await readFile(new URL("../src/app/login/page.tsx", import.meta.url), "utf8");
assert.match(page, /providers\.google &&/);
assert.match(page, /providers\.email &&/);

const submissionRepository = await readFile(new URL("../src/lib/submissions/repository.ts", import.meta.url), "utf8");
assert.doesNotMatch(
  submissionRepository,
  /\.insert\(\{[^}]*status:/,
  "draft creation must let the database default set status because authenticated users cannot insert that workflow column",
);

const submissionRoute = await readFile(new URL("../src/app/api/submissions/route.ts", import.meta.url), "utf8");
assert.match(
  submissionRoute,
  /authentication_required[^\n]*status:\s*401/,
  "draft creation must return a JSON 401 instead of redirecting fetch requests to HTML",
);

console.log("Auth launch safeguards verified: fail-closed providers, server-side enforcement, canonical HTTPS callbacks, and safe private-draft creation.");
