"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { HumanEntry } from "@/lib/archive/types";
import { resolveMediaUrl } from "@/lib/media/resolver";

type Props = {
  entry: HumanEntry | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
};

export function HumanStoryDrawer({ entry, loading, error, onClose, onRetry }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  const identity = entry?.person?.anonymous
    ? "Anonymous"
    : entry?.person?.displayName ?? entry?.headline ?? "Human";
  const images = entry
    ? [...(entry.thumbnail ? [entry.thumbnail] : []), ...(entry.media ?? [])]
      .filter((asset, index, all) => asset.kind === "image" && all.findIndex(candidate => candidate.id === asset.id) === index)
    : [];
  const audio = entry?.media?.filter(asset => asset.kind === "audio") ?? [];
  const video = entry?.media?.filter(asset => asset.kind === "video") ?? [];

  return (
    <div className="human-story-drawer-layer">
      <button className="human-story-drawer-scrim" type="button" onClick={onClose} aria-label="Close human story" />
      <aside className="human-story-drawer" role="dialog" aria-modal="true" aria-label={entry ? `${identity}'s story` : "Human story"}>
        <header>
          <span>HUMAN<span>:</span>HERE</span>
          <small>Human story</small>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close human story">Close <b aria-hidden="true">×</b></button>
        </header>

        {loading && (
          <div className="human-story-drawer-status" aria-live="polite">
            <i aria-hidden="true" />
            <p>Bringing this human into view.</p>
          </div>
        )}

        {error && !loading && (
          <div className="human-story-drawer-status" role="alert">
            <p>{error}</p>
            <button type="button" onClick={onRetry}>Try again →</button>
          </div>
        )}

        {entry && !loading && (
          <article>
            <section className="human-story-drawer-intro">
              <p>{entry.fixture ? `Demo human · ${entry.type}` : entry.type}</p>
              <h2 id="human-story-drawer-title">{identity}</h2>
              {entry.person?.location && <span>{entry.person.location}</span>}
              {entry.quote && <blockquote>“{entry.quote}”</blockquote>}
              <small>{entry.loveCount > 0 ? `${entry.loveCount.toLocaleString()} people sent love` : "Send love"}</small>
            </section>

            {images[0] && (
              <figure className="human-story-drawer-hero">
                <Image
                  src={resolveMediaUrl(images[0])}
                  alt={images[0].alt}
                  fill
                  sizes="(max-width: 760px) 100vw, 46vw"
                  style={{ objectPosition: images[0].objectPosition }}
                />
                {images[0].caption && <figcaption>{images[0].caption}</figcaption>}
              </figure>
            )}

            <div className="human-story-drawer-content">
              {entry.headline && <h3>{entry.headline}</h3>}
              {entry.blocks?.map(block => {
                if (block.type === "text") return <section key={block.id}>{block.heading && <h3>{block.heading}</h3>}{block.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>;
                if (block.type === "quote") return <blockquote key={block.id}>“{block.quote}”</blockquote>;
                if (block.type === "note") return <aside key={block.id}><p>{block.text}</p>{block.attribution && <small>{block.attribution}</small>}</aside>;
                return null;
              })}
              {!entry.blocks?.length && entry.story && <p>{entry.story}</p>}
            </div>

            {images.slice(1).map(asset => (
              <figure className="human-story-drawer-secondary" key={asset.id}>
                <Image src={resolveMediaUrl(asset)} alt={asset.alt} fill sizes="(max-width: 760px) 100vw, 46vw" />
                {asset.caption && <figcaption>{asset.caption}</figcaption>}
              </figure>
            ))}

            {audio.map(asset => <section className="human-story-drawer-media" key={asset.id}><span>Listen</span><audio controls preload="metadata" src={resolveMediaUrl(asset)} /></section>)}
            {video.map(asset => <section className="human-story-drawer-media" key={asset.id}><video controls preload="metadata" poster={asset.poster}><source src={resolveMediaUrl(asset)} type={asset.mimeType} /></video></section>)}

            <footer>
              <p>People need people.</p>
              <button type="button" onClick={onClose}>Return to the globe →</button>
            </footer>
          </article>
        )}
      </aside>
    </div>
  );
}
