import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export class HelpAuthorizationError extends Error {
  constructor(message = "Not authorized for this help operation.") {
    super(message);
    this.name = "HelpAuthorizationError";
  }
}

export async function requireHelpUser() {
  const client = await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new HelpAuthorizationError("Authentication required.");
  return { client, user };
}

export async function requireHelpStaff() {
  const context = await requireHelpUser();
  const { data, error } = await context.client.rpc("is_help_staff");
  if (error || data !== true) throw new HelpAuthorizationError();
  return context;
}
