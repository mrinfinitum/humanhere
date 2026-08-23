import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publishSubmissionAction } from "./actions";

export default async function SubmissionReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requireStaff();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: submission }, { data: consent }, { data: media }] = await Promise.all([
    supabase.from("submissions").select("id,status,public_name,anonymous,location,headline,story,what_they_need,need_category,created_at").eq("id", id).maybeSingle(),
    supabase.from("consent_records").select("publish_story,publish_media,social_reuse,may_contact,partner_referral,verified_at,revoked_at,created_at").eq("submission_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("submission_media").select("id,media_type,mime_type,byte_size,caption,sort_order").eq("submission_id", id).order("sort_order").limit(20),
  ]);
  if (!submission) notFound();
  const consentRecord = consent as Record<string, unknown> | null;
  const publishable = ["approved", "in_review", "contacted"].includes(String(submission.status)) && Boolean(consentRecord?.verified_at) && !consentRecord?.revoked_at && Boolean(consentRecord?.publish_story);
  return <section className="admin-review"><p className="eyebrow">Human review</p><h1>{String(submission.headline ?? submission.public_name ?? "Untitled submission")}</h1><dl><dt>Status</dt><dd>{String(submission.status)}</dd><dt>Public identity</dt><dd>{submission.anonymous ? "Anonymous" : String(submission.public_name ?? "Not supplied")}</dd><dt>Location</dt><dd>{String(submission.location ?? "Withheld")}</dd><dt>Need</dt><dd>{String(submission.need_category ?? "Not categorized")}</dd></dl><article>{String(submission.story ?? "No written story.")}</article><section><h2>Private media</h2><p>{media?.length ?? 0} files. Review uses signed URLs in the final connected environment.</p></section><section><h2>Consent</h2><pre>{JSON.stringify(consentRecord, null, 2)}</pre></section>{publishable ? <form action={publishSubmissionAction}><input type="hidden" name="submissionId" value={id} /><label>Public slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label><button>Publish transactionally →</button></form> : <p className="admin-warning">Publication remains locked until editorial status and verified, active story consent are present.</p>}</section>;
}
