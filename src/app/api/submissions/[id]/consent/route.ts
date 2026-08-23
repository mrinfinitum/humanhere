import { requireUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const keys = ["publishStory", "publishMedia", "socialReuse", "mayContact", "partnerReferral"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/share");
  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  const consent = Object.fromEntries(keys.map(key => [key, body[key] === true])) as Record<(typeof keys)[number], boolean>;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("consent_records").insert({
    submission_id: id, user_id: user.id, publish_story: consent.publishStory,
    publish_media: consent.publishMedia, social_reuse: consent.socialReuse,
    may_contact: consent.mayContact, partner_referral: consent.partnerReferral,
    consented_at: new Date().toISOString(),
  });
  if (error) return Response.json({ error: "Consent could not be recorded." }, { status: 400 });
  return Response.json({ recorded: true });
}
