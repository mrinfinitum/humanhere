"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArchiveBatch } from "@/lib/archive/types";
import { ArchiveCanvas } from "./ArchiveCanvas";
import { ArchiveChrome } from "./ArchiveChrome";
import { ArchiveIdentity } from "./ArchiveIdentity";
import { ArtifactCard } from "./ArtifactCard";

export function ArchiveField({ initialBatch, mode = "home" }: { initialBatch: ArchiveBatch; mode?: "home" | "index" }) {
  if (mode === "home") return <ArchiveCanvas initialBatch={initialBatch} />;
  return <ArchiveIndex initialBatch={initialBatch} />;
}

function ArchiveIndex({ initialBatch }: { initialBatch: ArchiveBatch }) {
  const [entries, setEntries] = useState(initialBatch.entries);
  const [cursor, setCursor] = useState(initialBatch.nextCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const autoLoadedRef = useRef(false);

  const loadNext = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/humans?cursor=${encodeURIComponent(cursor)}&limit=36`);
      if (!response.ok) throw new Error("Archive batch unavailable");
      const batch = await response.json() as ArchiveBatch;
      setEntries(current => [...current, ...batch.entries].filter((entry, index, all) => all.findIndex(candidate => candidate.id === entry.id) === index));
      setCursor(batch.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !cursor || autoLoadedRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !autoLoadedRef.current) {
        autoLoadedRef.current = true;
        void loadNext();
      }
    }, { rootMargin: "500px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, loadNext]);

  const lead = entries.slice(0, 5);
  const remainder = entries.slice(5);

  return (
    <main className="human-field human-field--index" id="human-archive">
      <a className="archive-skip" href="#archive-progress">Skip archive objects</a>
      <ArchiveChrome count={entries.length} total={initialBatch.total} />
      <section className="archive-grid" aria-label="Human archive artifacts">
        {lead.map((entry, index) => <ArtifactCard key={entry.id} entry={entry} index={index} priority={index < 3} />)}
        <ArchiveIdentity />
        {remainder.map((entry, index) => <ArtifactCard key={entry.id} entry={entry} index={index + lead.length} />)}
      </section>
      <div className="archive-progress" id="archive-progress" ref={sentinelRef}>
        <p>{cursor ? "More humanity continues." : "You have reached the edge of this development field—not the archive."}</p>
        {cursor && <button type="button" onClick={() => void loadNext()} disabled={loading}>{loading ? "Revealing…" : "Reveal more"}</button>}
      </div>
    </main>
  );
}
