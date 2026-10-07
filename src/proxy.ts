import { NextResponse, type NextRequest } from "next/server";
import { getNeonAuth } from "@/lib/auth/neon";
import { safeNext } from "@/lib/auth/redirect";
import { hasNeonAuthEnvironment } from "@/lib/neon/env";

export async function proxy(request: NextRequest) {
  if (!hasNeonAuthEnvironment()) return NextResponse.next();
  // Preserve the requested page so sign-in returns there.
  const { pathname, search } = request.nextUrl;
  const loginUrl = `/login?next=${encodeURIComponent(safeNext(`${pathname}${search}`))}`;
  return getNeonAuth().middleware({ loginUrl })(request);
}

// API routes enforce authentication themselves and return JSON errors.
// Public archive pages must stay accessible without an account. Sign-in links
// are verified by /auth/complete itself, so it is not matched here.
export const config = {
  matcher: ["/account/:path*", "/share/:path*", "/admin/:path*", "/welcome"],
};
