import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { requestRemoval } from "./actions";

async function RemovalContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  await requireUser("/remove-my-story");
  const query = await searchParams;
  if (query.submitted === "1") return <section><p className="eyebrow">Request received</p><h1>We will verify this with care.</h1><p>Your story is not deleted automatically. A HUMAN:HERE team member will verify the request, unpublish approved content, invalidate public caches, and follow the applicable media policy.</p><Link href="/account">My HUMAN:HERE →</Link></section>;
  return <section><p className="eyebrow">Your story stays yours</p><h1>Request a change or removal.</h1><p>This private request begins a verification process. If there is an immediate safety concern, say so in the message.</p><form action={requestRemoval}><label>Your name<input name="name" required /></label><label>Story ID <span>(optional)</span><input name="humanEntryId" /></label><label>Reason<input name="reason" required /></label><label>Anything we should know<textarea name="message" rows={7} /></label><button>Send private request →</button></form></section>;
}

export default function RemovalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <main className="removal-page"><Link href="/">HUMAN<span>:</span>HERE</Link><Suspense fallback={<p>Opening removal request…</p>}><RemovalContent searchParams={searchParams} /></Suspense></main>;
}
