import { AdminQueue } from "@/components/admin/AdminQueue";
import { getRemovalQueue } from "@/lib/admin/queries";
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { const q = await searchParams; const cursor = typeof q.cursor === "string" ? q.cursor : undefined; const result = await getRemovalQueue(cursor); return <AdminQueue title="Removal requests" rows={result.rows} nextHref={result.next ? `/admin/removal-requests?cursor=${encodeURIComponent(result.next)}` : undefined} />; }
