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
    supabase
      .from("submissions")
      .select("id,status,public_name,anonymous,location,location_withheld,is_minor,headline,story,what_they_need,need_category,created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("consent_records")
      .select("publish_story,publish_media,social_reuse,may_contact,partner_referral,verified_at,revoked_at,created_at")
      .eq("submission_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("submission_media")
      .select("id,media_type,mime_type,byte_size,caption,sort_order")
      .eq("submission_id", id)
      .order("sort_order")
      .limit(20),
  ]);
  if (!submission) notFound();

  const consentRecord = consent as Record<string, unknown> | null;
  const locationWithheld = Boolean(submission.location_withheld);
  const hasPublicLocationLabel = !locationWithheld && Boolean(String(submission.location ?? "").trim());
  const publishable = submission.status === "approved"
    && Boolean(consentRecord?.verified_at)
    && !consentRecord?.revoked_at
    && Boolean(consentRecord?.publish_story);

  return (
    <section className="admin-review">
      <p className="eyebrow">Human review</p>
      <h1>{String(submission.headline ?? submission.public_name ?? "Untitled submission")}</h1>
      <dl>
        <dt>Status</dt><dd>{String(submission.status)}</dd>
        <dt>Public identity</dt><dd>{submission.anonymous ? "Anonymous" : String(submission.public_name ?? "Not supplied")}</dd>
        <dt>Location</dt><dd>{locationWithheld ? "Withheld" : String(submission.location ?? "Not supplied")}</dd>
        <dt>Minor</dt><dd>{submission.is_minor ? "Yes" : "No"}</dd>
        <dt>Need</dt><dd>{String(submission.need_category ?? "Not categorized")}</dd>
      </dl>
      <article>{String(submission.story ?? "No written story.")}</article>
      <section>
        <h2>Private media</h2>
        <p>{media?.length ?? 0} files. Review uses signed URLs in the final connected environment.</p>
      </section>
      <section>
        <h2>Consent</h2>
        <pre>{JSON.stringify(consentRecord, null, 2)}</pre>
      </section>
      {publishable ? (
        <form action={publishSubmissionAction}>
          <input type="hidden" name="submissionId" value={id} />
          <label>
            <span>Public slug</span>
            <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
          </label>
          {hasPublicLocationLabel ? (
            <fieldset className="admin-location-approval">
              <legend>Optional globe location</legend>
              <p>
                Use an editor-approved city, region, or country centroid only. Never paste a home address,
                submitted GPS, EXIF coordinate, shelter location, or exact personal location. Leave both fields
                blank to keep this story off the globe.
              </p>
              <label>
                <span>Public latitude</span>
                <input name="publicLatitude" type="number" min="-90" max="90" step="0.00001" inputMode="decimal" />
              </label>
              <label>
                <span>Public longitude</span>
                <input name="publicLongitude" type="number" min="-180" max="180" step="0.00001" inputMode="decimal" />
              </label>
              <label>
                <span>Approximation</span>
                <select name="publicLocationPrecision" defaultValue="city">
                  <option value="city">City centroid</option>
                  <option value="region">Region centroid</option>
                  <option value="country">Country centroid</option>
                </select>
              </label>
            </fieldset>
          ) : (
            <p className="admin-location-lock">
              Globe coordinates are unavailable because this submission withholds location or has no approved public location label.
            </p>
          )}
          <button>Publish transactionally →</button>
        </form>
      ) : (
        <p className="admin-warning">Publication remains locked until status is approved and verified, active story consent is present.</p>
      )}
    </section>
  );
}
