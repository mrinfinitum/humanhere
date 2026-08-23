import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { hasSupabasePublicEnvironment, getSupabasePublicEnvironment } from "./env";

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabasePublicEnvironment()) return response;

  const { url, publishableKey } = getSupabasePublicEnvironment();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims verifies the JWT and refreshes it when necessary. Never authorize
  // from getSession() alone because its cookie payload is not server-verified.
  await supabase.auth.getClaims();
  return response;
}
