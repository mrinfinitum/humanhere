import { AdminQueue } from "@/components/admin/AdminQueue";
import { getSubmissionQueue } from "@/lib/admin/queries";
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { const q = await searchParams; const cursor = typeof q.cursor === "string" ? q.cursor : undefined; const result = await getSubmissionQueue(cursor); return <AdminQueue title="Submissions" rows={result.rows} nextHref={result.next ? `/admin/submissions?cursor=${encodeURIComponent(result.next)}` : undefined} />; }
