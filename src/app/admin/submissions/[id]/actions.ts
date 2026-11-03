"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { publishApprovedSubmission, type ApprovedPublicLocation } from "@/lib/admin/publication";
import { requireStaff } from "@/lib/auth/server";
import { adminSql } from "@/lib/neon/admin";
import { publishMemberSubmission } from "@/lib/posts/publish";

const PUBLIC_LOCATION_PRECISIONS = new Set<ApprovedPublicLocation["precision"]>(["city", "region", "country"]);

function parsePublicLocation(formData: FormData): ApprovedPublicLocation | undefined {
  const latitudeValue = String(formData.get("publicLatitude") ?? "").trim();
  const longitudeValue = String(formData.get("publicLongitude") ?? "").trim();
  const precisionValue = String(formData.get("publicLocationPrecision") ?? "city");

  if (!latitudeValue && !longitudeValue) return undefined;
  if (!latitudeValue || !longitudeValue) throw new Error("Both approved public coordinates are required.");

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("Public latitude must be between -90 and 90.");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Public longitude must be between -180 and 180.");
  if (!PUBLIC_LOCATION_PRECISIONS.has(precisionValue as ApprovedPublicLocation["precision"])) throw new Error("Invalid public location precision.");

  return { latitude, longitude, precision: precisionValue as ApprovedPublicLocation["precision"] };
}

export async function publishSubmissionAction(formData: FormData) {
  const submissionId = String(formData.get("submissionId") ?? "");
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!/^[0-9a-f-]{36}$/i.test(submissionId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return;
  await publishApprovedSubmission(submissionId, slug, parsePublicLocation(formData));
  redirect(`/humans/${slug}`);
}

function heldId(formData: FormData) {
  const submissionId = String(formData.get("submissionId") ?? "");
  return /^[0-9a-f-]{36}$/i.test(submissionId) ? submissionId : null;
}

/** Staff looked at a story the automatic check held and it is fine: post it as the member shared it. */
export async function releaseHeldSubmission(formData: FormData) {
  await requireStaff(["editor", "admin"]);
  const submissionId = heldId(formData);
  if (!submissionId) return;
  const [held] = await adminSql()`update public.submissions set status = 'submitted' where id = ${submissionId}::uuid and status = 'in_review' returning user_id`;
  if (!held) return;
  const result = await publishMemberSubmission(String(held.user_id), submissionId, { checked: true });
  if (result.status === "published") redirect(`/humans/${result.slug}`);
}

/** Staff decided a held story should not post. The member can edit and share it again. */
export async function declineHeldSubmission(formData: FormData) {
  await requireStaff(["editor", "admin"]);
  const submissionId = heldId(formData);
  if (!submissionId) return;
  await adminSql()`update public.submissions set status = 'rejected' where id = ${submissionId}::uuid and status = 'in_review'`;
  refresh();
}
