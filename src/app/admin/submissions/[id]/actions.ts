"use server";

import { redirect } from "next/navigation";
import { publishApprovedSubmission, type ApprovedPublicLocation } from "@/lib/admin/publication";

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
