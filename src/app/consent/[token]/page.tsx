import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashCreatorConsentToken } from "@/lib/social/consent";
import { recordCreatorConsent } from "./actions";

async function CreatorConsentContent({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("social_creator_consent_tokens").select("id,expires_at,used_at,revoked_at").eq("token_hash", hashCreatorConsentToken(token)).is("used_at", null).is("revoked_at", null).filter("expires_at", "gt", "now()").maybeSingle() as unknown as { data: { id: string; expires_at: string; used_at: string | null; revoked_at: string | null } | null };
  if (!data) notFound();
  const action = recordCreatorConsent.bind(null, token);
  return <main className="removal-page"><Link href="/">HUMAN<span>:</span>HERE</Link><section><p className="eyebrow">Creator consent</p><h1>Your work.<br />Your choice.</h1><p>Using #humanhere was not consent. Choose separately what HUMAN:HERE may publish or reuse. Leaving a box unchecked means no.</p><form action={action}><label>Your name <span>(optional)</span><input name="name" /></label><label>Your email <span>(kept private)</span><input name="email" type="email" required /></label><label className="consent-control"><input name="publishStory" type="checkbox" /><span>HUMAN:HERE may publish this story.</span></label><label className="consent-control"><input name="publishMedia" type="checkbox" /><span>HUMAN:HERE may publish its photo/video.</span></label><label className="consent-control"><input name="socialReuse" type="checkbox" /><span>HUMAN:HERE may reuse it on social media.</span></label><button>Record my choices →</button></form></section></main>;
}

export default function CreatorConsentPage({ params }: { params: Promise<{ token: string }> }) {
  return <Suspense fallback={<main className="removal-page"><p>Verifying consent link…</p></main>}><CreatorConsentContent params={params} /></Suspense>;
}
