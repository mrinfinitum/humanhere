import "server-only";

import { requireStaff } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminQueueRow } from "@/components/admin/AdminQueue";

type Cursor = { createdAt: string; id: string };
const encode = (value: Cursor) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = (value?: string): Cursor | undefined => {
  if (!value) return;
  try { const parsed = JSON.parse(Buffer.from(value, "base64url").toString()) as Cursor; return parsed.createdAt && parsed.id ? parsed : undefined; } catch { return; }
};

export async function getSubmissionQueue(cursorValue?: string) {
  await requireStaff();
  const cursor = decode(cursorValue);
  let query = (await createSupabaseServerClient()).from("submissions").select("id,status,public_name,headline,created_at").neq("status", "draft").order("created_at").order("id").limit(41);
  if (cursor) query = query.or(`created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error(`Submission queue failed: ${error.code}`);
  const rows = (data ?? []).slice(0, 40).map(row => ({ id: String(row.id), status: String(row.status), title: String(row.headline ?? row.public_name ?? "Untitled submission"), createdAt: String(row.created_at), href: `/admin/submissions/${row.id}` }));
  const last = rows.at(-1);
  return { rows: rows as AdminQueueRow[], next: (data?.length ?? 0) > 40 && last ? encode({ createdAt: last.createdAt, id: last.id }) : undefined };
}

export async function getSocialQueue(cursorValue?: string) {
  await requireStaff();
  const cursor = decode(cursorValue);
  let query = (await createSupabaseServerClient()).from("social_discovery_posts").select("id,platform,source_url,author_username,moderation_status,created_at").order("created_at").order("id").limit(41);
  if (cursor) query = query.or(`created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error(`Social queue failed: ${error.code}`);
  const records = (data ?? []) as Array<Record<string, unknown>>;
  const rows = records.slice(0, 40).map(row => ({ id: String(row.id), status: String(row.moderation_status), title: String(row.author_username ?? row.platform), detail: String(row.source_url), createdAt: String(row.created_at) }));
  const last = rows.at(-1);
  return { rows, next: records.length > 40 && last ? encode({ createdAt: last.createdAt, id: last.id }) : undefined };
}

export async function getConsentQueue(cursorValue?: string) {
  await requireStaff();
  const cursor = decode(cursorValue);
  let query = (await createSupabaseServerClient()).from("consent_records").select("id,submission_id,verified_at,revoked_at,created_at").order("created_at").order("id").limit(41);
  if (cursor) query = query.or(`created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error(`Consent queue failed: ${error.code}`);
  const records = (data ?? []) as Array<Record<string, unknown>>;
  const rows = records.slice(0, 40).map(row => ({ id: String(row.id), status: row.revoked_at ? "revoked" : row.verified_at ? "verified" : "needs verification", title: `Submission ${String(row.submission_id).slice(0, 8)}`, createdAt: String(row.created_at) }));
  const last = rows.at(-1);
  return { rows, next: records.length > 40 && last ? encode({ createdAt: last.createdAt, id: last.id }) : undefined };
}

export async function getRemovalQueue(cursorValue?: string) {
  await requireStaff();
  const cursor = decode(cursorValue);
  let query = (await createSupabaseServerClient()).from("removal_requests").select("id,status,requester_name,requester_email,created_at").order("created_at").order("id").limit(41);
  if (cursor) query = query.or(`created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error(`Removal queue failed: ${error.code}`);
  const records = (data ?? []) as Array<Record<string, unknown>>;
  const rows = records.slice(0, 40).map(row => ({ id: String(row.id), status: String(row.status), title: String(row.requester_name), detail: String(row.requester_email), createdAt: String(row.created_at) }));
  const last = rows.at(-1);
  return { rows, next: records.length > 40 && last ? encode({ createdAt: last.createdAt, id: last.id }) : undefined };
}
