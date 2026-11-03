import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/server";
import { adminSql } from "@/lib/neon/admin";
import { dismissReports, takeDownReported } from "../moderation-actions";

type ReportRow = { entry_id: string; slug: string; headline: string | null; story: string | null; published: boolean; reports: number; reasons: string[]; details: string[] | null; first_reported: string };

export default async function ReportsPage() {
  await connection();
  await requireStaff();
  const rows = await adminSql()`select h.id as entry_id, h.slug, h.headline, h.story, h.published,
      count(*)::integer as reports, array_agg(distinct r.reason::text) as reasons,
      array_remove(array_agg(r.details), null) as details, min(r.created_at) as first_reported
    from public.content_reports r join public.human_entries h on h.id = r.human_entry_id
    where r.resolved_at is null
    group by h.id order by count(*) desc, min(r.created_at) limit 50` as unknown as ReportRow[];
  return (
    <section className="admin-moderation">
      <h1>Reports</h1>
      <p>Open reports, most reported first. Taking a story down removes it from the site at once.</p>
      {rows.length ? rows.map(row => (
        <article key={row.entry_id}>
          <header><b>{row.headline ?? "Untitled story"}</b><span>{row.reports} report{row.reports === 1 ? "" : "s"}</span></header>
          <ul>{row.reasons.map(reason => <li key={reason}>{reason.replaceAll("_", " ")}</li>)}</ul>
          {row.story && <p>{row.story}</p>}
          {row.details?.map((detail, index) => <blockquote key={index}>{detail}</blockquote>)}
          <footer>
            {row.published ? <Link href={`/humans/${row.slug}`}>View story →</Link> : <small>Already off the site</small>}
            <form action={takeDownReported}><input type="hidden" name="entryId" value={row.entry_id} /><button>Take down</button></form>
            <form action={dismissReports}><input type="hidden" name="entryId" value={row.entry_id} /><button>Dismiss</button></form>
          </footer>
        </article>
      )) : <p>No open reports.</p>}
    </section>
  );
}
