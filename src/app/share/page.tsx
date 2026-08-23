import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { submissionRepository } from "@/lib/submissions/repository";
import { ShareFlow } from "@/components/share/ShareFlow";
import { StartShare } from "./StartShare";

async function ShareContent({ draftId }: { draftId?: string }) {
  await connection();
  const user = await requireUser(draftId ? `/share?draft=${draftId}` : "/share");
  const draft = draftId ? await submissionRepository.getOwned(user.id, draftId) : undefined;
  return draft ? <ShareFlow initial={draft} /> : <section className="share-opening"><p className="eyebrow">Be seen</p><h1>This begins privately.</h1><p>You can tell a story, ask for help, offer help, or remain anonymous. Nothing publishes automatically, and receiving help never requires public exposure.</p><StartShare /></section>;
}

async function ShareRouteContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const draftId = typeof query.draft === "string" ? query.draft : undefined;
  return <ShareContent draftId={draftId} />;
}

export default function SharePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <main className="share-page"><Link className="share-mark" href="/">HUMAN<span>:</span>HERE</Link><Suspense fallback={<p>Opening a private space…</p>}><ShareRouteContent searchParams={searchParams} /></Suspense></main>;
}
