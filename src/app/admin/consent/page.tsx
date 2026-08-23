import { AdminQueue } from "@/components/admin/AdminQueue";
import { getConsentQueue } from "@/lib/admin/queries";
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { const q = await searchParams; const cursor = typeof q.cursor === "string" ? q.cursor : undefined; const result = await getConsentQueue(cursor); return <AdminQueue title="Consent verification" rows={result.rows} nextHref={result.next ? `/admin/consent?cursor=${encodeURIComponent(result.next)}` : undefined} />; }
