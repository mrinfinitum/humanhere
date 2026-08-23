"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabasePublicEnvironment } from "./env";

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabasePublicEnvironment();
  return createBrowserClient<Database>(url, publishableKey);
}
