import "server-only";

import { randomBytes } from "node:crypto";
import { expirePublishedHumanImmediately } from "@/lib/archive/cache";
import { copySubmissionMediaToPublic, privateMediaRows, removeUnreferencedPublicCopies } from "@/lib/admin/publication";
import { placeCentroid } from "@/lib/geo/places";
import { personalInfoReason } from "@/lib/moderation/personal-info";
import { adminSql } from "@/lib/neon/admin";

export type PublishResult = { status: "published"; slug: string } | { status: "held"; reason: string };

function slugFor(publicName: string | null, anonymous: boolean) {
  const first = anonymous ? "" : (publicName ?? "").trim().split(/\s+/)[0] ?? "";
  const base = first.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
  // A random suffix keeps slugs unique and unguessable from the name alone.
  return `${base || "human"}-${randomBytes(3).toString("hex")}`;
}

/**
 * Publishes a member's just-submitted story straight away, like a social post.
 * A story that looks like it shares a phone number, email or street address is
 * held for staff instead. The caller has already checked the signed-in member;
 * `checked` means staff looked at a held story and released it.
 */
export async function publishMemberSubmission(userId: string, submissionId: string, { checked = false } = {}): Promise<PublishResult> {
  const sql = adminSql();
  const [submission] = await sql`select public_name, anonymous, identity_mode, headline, story, location, location_withheld, media_withheld, status
    from public.submissions where id = ${submissionId}::uuid and user_id = ${userId}::uuid`;
  if (!submission || submission.status !== "submitted") throw new Error("This story is not ready to publish.");

  const reason = checked ? null : personalInfoReason(submission.headline as string | null, submission.story as string | null, submission.location as string | null);
  if (reason) {
    await sql`select public.hold_submission_for_review(${userId}::uuid, ${submissionId}::uuid, ${reason})`;
    return { status: "held", reason };
  }

  const [consent] = await sql`select publish_media from public.consent_records where submission_id = ${submissionId}::uuid order by created_at desc, id desc limit 1`;
  const rows = consent?.publish_media && !submission.media_withheld ? await privateMediaRows(submissionId) : [];
  const { copied, assets } = await copySubmissionMediaToPublic(submissionId, rows);
  const thumbnail = assets.find(asset => asset.kind === "image") ?? null;
  const anonymous = Boolean(submission.anonymous) || submission.identity_mode === "anonymous";
  const pin = submission.location_withheld ? null : placeCentroid(submission.location as string | null);
  let slug: string;
  try {
    const [published] = await sql`select public.self_publish_submission(
      ${userId}::uuid, ${submissionId}::uuid, ${slugFor(submission.public_name as string | null, anonymous)},
      ${thumbnail ? JSON.stringify(thumbnail) : null}::jsonb, ${assets.length ? JSON.stringify(assets) : null}::jsonb,
      ${pin?.latitude ?? null}, ${pin?.longitude ?? null}, ${pin?.precision ?? null}::public.human_public_location_precision
    ) as slug`;
    slug = String(published.slug);
  } catch (error) {
    if (copied.length) await removeUnreferencedPublicCopies(submissionId, copied);
    throw error;
  }
  // Expire now rather than serving the old lists once more: the author expects to see their post.
  expirePublishedHumanImmediately(slug);
  return { status: "published", slug };
}
