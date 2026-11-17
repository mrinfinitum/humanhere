import { getNeonAuth } from "@/lib/auth/neon";
import { hasNeonAuthEnvironment } from "@/lib/neon/env";

type Context = { params: Promise<{ path: string[] }> };

function unavailable() {
  return Response.json({ error: "Account access is temporarily unavailable." }, { status: 503 });
}

// Signing in, signing up and password resets run in the login server actions,
// which check Turnstile and call Neon Auth directly. Passing those writes
// through here would let a script skip the CAPTCHA and mail anyone sign-in or
// reset emails, so only provider callbacks may POST (Apple posts its callback).
// Browsers still need the GET routes: the session, sign-in links and callbacks.
function writeAllowed(path: string[]) {
  return path[0] === "callback" && path.length === 2;
}

export async function GET(request: Request, context: Context) {
  if (!hasNeonAuthEnvironment()) return unavailable();
  return getNeonAuth().handler().GET(request, context);
}

export async function POST(request: Request, context: Context) {
  if (!hasNeonAuthEnvironment()) return unavailable();
  const { path } = await context.params;
  if (!writeAllowed(path)) return Response.json({ error: "not_found" }, { status: 404 });
  return getNeonAuth().handler().POST(request, context);
}
