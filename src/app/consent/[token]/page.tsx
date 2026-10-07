import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { adminSql } from "@/lib/neon/admin";
import { hashCreatorConsentToken } from "@/lib/social/consent";
import { recordCreatorConsent } from "./actions";

async function CreatorConsentContent({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();
  const [data] = await adminSql()`select id from public.social_creator_consent_tokens
    where token_hash = ${hashCreatorConsentToken(token)} and used_at is null and revoked_at is null and expires_at > now()`;
  if (!data) notFound();
  const action = recordCreatorConsent.bind(null, token);
  return <main className="removal-page"><Link href="/">HUMAN<span>:</span>HERE</Link><section><p className="eyebrow">Creator consent</p><h1>Your work.<br />Your choice.</h1><p>Using #humanhere was not consent. Choose separately what HUMAN:HERE may publish or reuse. Leaving a box unchecked means no.</p><form action={action}><label>Your name <span>(optional)</span><input name="name" /></label><label>Your email <span>(kept private)</span><input name="email" type="email" required /></label><label className="consent-control"><input name="publishStory" type="checkbox" /><span>HUMAN:HERE may publish this story.</span></label><label className="consent-control"><input name="publishMedia" type="checkbox" /><span>HUMAN:HERE may publish its photo/video.</span></label><label className="consent-control"><input name="socialReuse" type="checkbox" /><span>HUMAN:HERE may reuse it on social media.</span></label><button>Record my choices →</button></form></section></main>;
}

export default function CreatorConsentPage({ params }: { params: Promise<{ token: string }> }) {
  return <Suspense fallback={<main className="removal-page"><p>Verifying consent link…</p></main>}><CreatorConsentContent params={params} /></Suspense>;
}
