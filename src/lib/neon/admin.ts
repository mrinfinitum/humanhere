import "server-only";

import { neon } from "@neondatabase/serverless";

// Privileged SQL is restricted to explicitly authorized server workflows.
// Never use this connection for visitor reads or ordinary user mutations.
export function adminSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Neon privileged database connection is not configured.");
  return neon(url);
}
