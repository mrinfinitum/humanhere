import type { Database } from "@/lib/neon/database.types";
import { createDatabaseClient, getSessionUser } from "@/lib/neon/server";

type ReportReason = Database["public"]["Enums"]["report_reason"];
const REASONS = new Set<ReportReason>(["harassment", "hate", "private_information", "sexual_content", "violence", "self_harm", "minor_safety", "spam", "impersonation", "other"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// The segment is the entry id, as in the notes and love routes beside it.
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "invalid_origin" }, { status: 403 });
  const { slug: entryId } = await params;
  if (!UUID.test(entryId)) return Response.json({ error: "Story not found." }, { status: 404 });
  if (!await getSessionUser()) return Response.json({ error: "Sign in to report a story." }, { status: 401 });
  const body = await request.json().catch(() => null) as { reason?: unknown; details?: unknown } | null;
  const reason = body?.reason as ReportReason;
  if (!REASONS.has(reason)) return Response.json({ error: "Choose a reason." }, { status: 400 });
  const details = typeof body?.details === "string" ? body.details.slice(0, 1000) : undefined;
  const { error } = await (await createDatabaseClient()).rpc("report_content", { p_human_entry_id: entryId, p_reason: reason, p_details: details });
  if (error?.message === "report limit reached") return Response.json({ error: "You have sent a lot of reports. Please try again later." }, { status: 429 });
  if (error) return Response.json({ error: "This story could not be reported." }, { status: 422 });
  return Response.json({ reported: true }, { status: 201 });
}
