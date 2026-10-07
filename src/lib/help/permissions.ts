import "server-only";

import { createDatabaseClient, getSessionUser } from "@/lib/neon/server";

export class HelpAuthorizationError extends Error {
  constructor(message = "Not authorized for this help operation.") {
    super(message);
    this.name = "HelpAuthorizationError";
  }
}

export async function requireHelpUser() {
  const user = await getSessionUser();
  if (!user) throw new HelpAuthorizationError("Authentication required.");
  const client = await createDatabaseClient();
  return { client, user };
}

export async function requireHelpStaff() {
  const context = await requireHelpUser();
  const { data, error } = await context.client.rpc("is_help_staff");
  if (error || data !== true) throw new HelpAuthorizationError();
  return context;
}
