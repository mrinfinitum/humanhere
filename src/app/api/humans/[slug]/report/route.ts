import { after } from "next/server";
import type { Database } from "@/lib/neon/database.types";
import { alertStaff } from "@/lib/notify/staff-alerts";
import { apiMember } from "@/lib/auth/server";
import { adminSql } from "@/lib/neon/admin";
import { createDatabaseClient } from "@/lib/neon/server";

type ReportReason = Database["public"]["Enums"]["report_reason"];
const REASONS = new Set<ReportReason>(["harassment", "hate", "private_information", "sexual_content", "violence", "self_harm", "minor_safety", "spam", "impersonation", "other"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// The segment is the entry id, as in the notes and love routes beside it.
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "invalid_origin" }, { status: 403 });
  const { slug: entryId } = await params;
  if (!UUID.test(entryId)) return Response.json({ error: "Story not found." }, { status: 404 });
  const { response } = await apiMember();
  if (response) return response;
  const body = await request.json().catch(() => null) as { reason?: unknown; details?: unknown } | null;
  const reason = body?.reason as ReportReason;
  if (!REASONS.has(reason)) return Response.json({ error: "Choose a reason." }, { status: 400 });
  const details = typeof body?.details === "string" ? body.details.slice(0, 1000) : undefined;
  const { error } = await (await createDatabaseClient()).rpc("report_content", { p_human_entry_id: entryId, p_reason: reason, p_details: details });
  if (error?.message === "report limit reached") return Response.json({ error: "You have sent a lot of reports. Please try again later." }, { status: 429 });
  if (error) return Response.json({ error: "This story could not be reported." }, { status: 422 });
  // One email per reported story, not per report, and never the reporter's own
  // words, so reports cannot flood staff inboxes or carry phishing text.
  after(async () => {
    const [open] = await adminSql()`select count(*)::integer as count from public.content_reports
      where human_entry_id = ${entryId}::uuid and resolved_at is null`;
    if (Number(open?.count) !== 1) return;
    await alertStaff({
      subject: "A story was reported",
      lines: [`Reason: ${reason.replaceAll("_", " ")}.`, "Read the report, then take the story down or dismiss it from the admin reports page."],
      path: "/admin/reports",
    });
  });
  return Response.json({ reported: true }, { status: 201 });
}
