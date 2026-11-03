"use server";

import { refresh } from "next/cache";
import { expirePublishedHumanImmediately } from "@/lib/archive/cache";
import { requireStaff } from "@/lib/auth/server";
import { adminSql } from "@/lib/neon/admin";

const idFrom = (formData: FormData, name: string) => {
  const value = String(formData.get(name) ?? "");
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
};

/** Takes a reported story down and closes every open report on it. */
export async function takeDownReported(formData: FormData) {
  const { user } = await requireStaff();
  const entryId = idFrom(formData, "entryId");
  if (!entryId) return;
  const sql = adminSql();
  const [entry] = await sql`update public.human_entries set published = false where id = ${entryId}::uuid returning slug`;
  await sql`update public.content_reports set resolved_at = now(), resolved_by = ${user.id}::uuid, resolution = 'removed'
    where human_entry_id = ${entryId}::uuid and resolved_at is null`;
  if (entry?.slug) expirePublishedHumanImmediately(String(entry.slug));
  refresh();
}

export async function dismissReports(formData: FormData) {
  const { user } = await requireStaff();
  const entryId = idFrom(formData, "entryId");
  if (!entryId) return;
  await adminSql()`update public.content_reports set resolved_at = now(), resolved_by = ${user.id}::uuid, resolution = 'dismissed'
    where human_entry_id = ${entryId}::uuid and resolved_at is null`;
  refresh();
}
