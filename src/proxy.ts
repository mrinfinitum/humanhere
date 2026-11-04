import { NextResponse, type NextRequest } from "next/server";
import { getNeonAuth } from "@/lib/auth/neon";
import { safeNext } from "@/lib/auth/redirect";
import { hasNeonAuthEnvironment } from "@/lib/neon/env";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Browsers attach the session cookie to cross-site requests, so API writes
// must come from this site. Neon Auth checks its own trusted origins, and
// Vercel Cron calls with a secret, so both are left to their own checks.
function crossOriginWrite(request: NextRequest) {
  if (SAFE_METHODS.has(request.method)) return false;
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/cron/")) return false;
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    try { return new URL(origin).host !== host; } catch { return true; }
  }
  // No Origin header: rely on Fetch Metadata when the browser sends it.
  const site = request.headers.get("sec-fetch-site");
  return site !== null && site !== "same-origin" && site !== "none";
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return crossOriginWrite(request)
      ? NextResponse.json({ error: "cross_origin_request" }, { status: 403 })
      : NextResponse.next();
  }
  if (!hasNeonAuthEnvironment()) return NextResponse.next();
  // Preserve the requested page so sign-in returns there.
  const { pathname, search } = request.nextUrl;
  const loginUrl = `/login?next=${encodeURIComponent(safeNext(`${pathname}${search}`))}`;
  return getNeonAuth().middleware({ loginUrl })(request);
}

// API routes enforce authentication themselves and return JSON errors; the
// proxy only rejects cross-site writes there. Public archive pages must stay
// accessible without an account. Sign-in links are verified by /auth/complete
// itself, so it is not matched here.
export const config = {
  matcher: ["/account/:path*", "/share/:path*", "/admin/:path*", "/welcome", "/api/:path*"],
};
