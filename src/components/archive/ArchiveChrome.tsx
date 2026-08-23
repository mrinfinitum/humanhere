import Link from "next/link";

export function ArchiveChrome({ count, total }: { count: number; total?: number }) {
  return (
    <>
      <Link className="archive-add" href="/share">+ Add your story</Link>
      <div className="archive-count" aria-live="polite"><span>{String(count).padStart(3, "0")}</span>{typeof total === "number" ? ` / ${String(total).padStart(3, "0")}` : " +"}</div>
      <nav className="archive-dock" aria-label="Archive navigation">
        <Link href="/humans">Humans</Link>
        <Link href="/about">Why we show up</Link>
        <Link href="/get-involved">Show up</Link>
      </nav>
    </>
  );
}
