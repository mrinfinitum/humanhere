import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabasePublicEnvironment } from "./env";

/** Cookie-free public client. It never adopts a visitor session, so cached
 * public reads cannot vary by user and remain safe to share through the CDN. */
export function createSupabasePublicClient() {
  const { url, publishableKey } = getSupabasePublicEnvironment();
  return createClient<Database>(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
