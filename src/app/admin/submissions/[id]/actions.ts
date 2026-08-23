"use server";

import { redirect } from "next/navigation";
import { publishApprovedSubmission } from "@/lib/admin/publication";

export async function publishSubmissionAction(formData: FormData) {
  const submissionId = String(formData.get("submissionId") ?? "");
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!/^[0-9a-f-]{36}$/i.test(submissionId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return;
  await publishApprovedSubmission(submissionId, slug);
  redirect(`/humans/${slug}`);
}
