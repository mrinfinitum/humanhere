import { getAuthenticatedUser } from "@/lib/auth/server";
import { CONSENT_VERSION } from "@/lib/legal/versions";
import { createDatabaseClient } from "@/lib/neon/server";

const keys = ["publishStory", "publishMedia", "socialReuse", "mayContact", "partnerReferral"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // These cookie-authenticated mutations must originate from the app.
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "invalid_origin" }, { status: 403 });
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "invalid_submission" }, { status: 400 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return Response.json({ error: "invalid_consent" }, { status: 400 });
  const consent = Object.fromEntries(keys.map(key => [key, body[key] === true])) as Record<(typeof keys)[number], boolean>;
  const database = await createDatabaseClient();
  const { error } = await database.from("consent_records").insert({
    submission_id: id, user_id: user.id, publish_story: consent.publishStory,
    publish_media: consent.publishMedia, social_reuse: consent.socialReuse,
    may_contact: consent.mayContact, partner_referral: consent.partnerReferral,
    consented_at: new Date().toISOString(), consent_version: CONSENT_VERSION,
  });
  if (error) return Response.json({ error: "Consent could not be recorded." }, { status: 400 });
  return Response.json({ recorded: true });
}
