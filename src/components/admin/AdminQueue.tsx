import Link from "next/link";

export type AdminQueueRow = {
  id: string;
  status: string;
  title: string;
  detail?: string;
  createdAt: string;
  href?: string;
};

export function AdminQueue({ title, rows, nextHref }: { title: string; rows: AdminQueueRow[]; nextHref?: string }) {
  return <section className="admin-queue"><header><p className="eyebrow">Private moderation</p><h1>{title}</h1><span>{rows.length} in this batch</span></header>{rows.length ? <ol>{rows.map(row => <li key={row.id}><span>{row.status.replaceAll("_", " ")}</span><div>{row.href ? <Link href={row.href}><strong>{row.title}</strong></Link> : <strong>{row.title}</strong>}{row.detail && <small>{row.detail}</small>}</div><time dateTime={row.createdAt}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(row.createdAt))}</time></li>)}</ol> : <p>Nothing is waiting in this queue.</p>}{nextHref && <Link className="admin-next" href={nextHref}>Next 40 →</Link>}</section>;
}
