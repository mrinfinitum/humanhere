import "server-only";

export type OperationalEvent = "public_query_failed" | "auth_failed" | "upload_failed" | "storage_failed" | "social_ingestion_failed" | "moderation_job_failed" | "database_mutation_failed" | "help_operation_failed";

/** Logs operational metadata only. Never pass story text, email, phone, address,
 * delivery notes, fulfillment profiles, private object paths, consent tokens,
 * or moderation notes in context. */
export function reportOperationalError(event: OperationalEvent, error: unknown, context: Record<string, string | number | boolean> = {}) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "unknown";
  console.error(JSON.stringify({ level: "error", event, code, context, at: new Date().toISOString() }));
}
