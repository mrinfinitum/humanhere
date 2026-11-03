import { getAuthenticatedUser } from "@/lib/auth/server";
import { CONSENT_VERSION } from "@/lib/legal/versions";
import { createDatabaseClient } from "@/lib/neon/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // These cookie-authenticated mutations must originate from the app.
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "invalid_origin" }, { status: 403 });
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "invalid_submission" }, { status: 400 });
  const database = await createDatabaseClient();
  // Submitting asks to publish the story and the media added to it. Contact
  // and partner help follow from what the member said would help; featuring
  // on our social media is the one choice kept in their settings.
  const [{ data: story }, { data: settings }] = await Promise.all([
    database.from("submissions").select("what_they_need").eq("id", id).eq("user_id", user.id).maybeSingle(),
    database.from("profiles").select("allow_social_reuse").eq("id", user.id).maybeSingle(),
  ]);
  if (!story || !settings) return Response.json({ error: "Your story could not be read." }, { status: 400 });
  const help = story.what_they_need?.[0];
  const consent = {
    publishStory: true, publishMedia: true, socialReuse: settings.allow_social_reuse,
    mayContact: Boolean(help && help !== "share_only"),
    partnerReferral: help === "practical_help" || help === "resources",
  };
  const { error } = await database.from("consent_records").insert({
    submission_id: id, user_id: user.id, publish_story: consent.publishStory,
    publish_media: consent.publishMedia, social_reuse: consent.socialReuse,
    may_contact: consent.mayContact, partner_referral: consent.partnerReferral,
    consented_at: new Date().toISOString(), consent_version: CONSENT_VERSION,
  });
  if (error) return Response.json({ error: "Consent could not be recorded." }, { status: 400 });
  return Response.json({ recorded: true });
}
