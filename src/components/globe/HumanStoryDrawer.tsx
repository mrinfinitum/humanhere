"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
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
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loved, setLoved] = useState(false);
  const [loveCount, setLoveCount] = useState(entry?.loveCount ?? 0);
  const [lovePending, setLovePending] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [notePending, setNotePending] = useState(false);
  const [noteSubmitted, setNoteSubmitted] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!entry || entry.fixture) return;

    const controller = new AbortController();
    void fetch(`/api/humans/${entry.id}/love`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async response => {
      const payload = await response.json() as {
        authenticated?: boolean;
        loved?: boolean;
        loveCount?: number;
      };
      if (!response.ok) throw new Error("Love is temporarily unavailable.");
      setAuthenticated(Boolean(payload.authenticated));
      setLoved(Boolean(payload.loved));
      setLoveCount(Number(payload.loveCount ?? entry.loveCount));
    }).catch(fetchError => {
      if (controller.signal.aborted) return;
      setAuthenticated(false);
      setSocialError(fetchError instanceof Error ? fetchError.message : "Love is temporarily unavailable.");
    });

    return () => controller.abort();
  }, [entry]);

  const signIn = () => {
    if (!entry) return;
    router.push(`/login?next=${encodeURIComponent(`/?human=${entry.slug}`)}`);
  };

  const toggleLove = async () => {
    if (!entry || entry.fixture || lovePending) return;
    if (!authenticated) {
      signIn();
      return;
    }

    setLovePending(true);
    setSocialError(null);
    try {
      const response = await fetch(`/api/humans/${entry.id}/love`, {
        method: loved ? "DELETE" : "POST",
      });
      const payload = await response.json() as { loved?: boolean; loveCount?: number; error?: string };
      if (response.status === 401) {
        signIn();
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "Love could not be updated.");
      setLoved(Boolean(payload.loved));
      setLoveCount(Number(payload.loveCount ?? loveCount));
    } catch (loveError) {
      setSocialError(loveError instanceof Error ? loveError.message : "Love could not be updated.");
    } finally {
      setLovePending(false);
    }
  };

  const beginNote = () => {
    if (!entry || entry.fixture) return;
    if (!authenticated) {
      signIn();
      return;
    }
    setNoteOpen(true);
    setNoteError(null);
  };

  const submitNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!entry || entry.fixture || notePending) return;
    const body = noteBody.trim();
    if (!body) {
      setNoteError("Write a note before sending it.");
      return;
    }

    setNotePending(true);
    setNoteError(null);
    try {
      const response = await fetch(`/api/humans/${entry.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await response.json() as { error?: string };
      if (response.status === 401) {
        signIn();
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "Your note could not be sent.");
      setNoteBody("");
      setNoteSubmitted(true);
    } catch (submitError) {
      setNoteError(submitError instanceof Error ? submitError.message : "Your note could not be sent.");
    } finally {
      setNotePending(false);
    }
  };

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
              <small>{loveCount > 0 ? `${loveCount.toLocaleString()} people sent love` : "Be the first to send love"}</small>
            </section>

            <section className="human-story-actions" aria-label={`Ways to show up for ${identity}`}>
              {entry.fixture ? (
                <div className="human-story-actions-fixture">
                  <span>Development story</span>
                  <p>Love and private Notes become available only on real, consent-verified published Humans.</p>
                </div>
              ) : (
                <>
                  <div className="human-story-actions-primary">
                    <button
                      className={loved ? "is-loved" : undefined}
                      type="button"
                      aria-pressed={loved}
                      disabled={lovePending || authenticated === null}
                      onClick={() => void toggleLove()}
                    >
                      <span aria-hidden="true">♥</span>
                      <b>{loved ? "Love sent" : "Send love"}</b>
                      <small>{loveCount.toLocaleString()}</small>
                    </button>
                    {entry.allowPrivateNotes && (
                      <button type="button" onClick={beginNote} aria-expanded={noteOpen}>
                        <span aria-hidden="true">↗</span>
                        <b>Leave a note</b>
                        <small>Private</small>
                      </button>
                    )}
                  </div>

                  {socialError && <p className="human-story-action-error" role="alert">{socialError}</p>}

                  {entry.allowPrivateNotes && noteOpen && !noteSubmitted && (
                    <form className="human-story-note-form" onSubmit={submitNote}>
                      <header>
                        <div>
                          <span>Private encouragement</span>
                          <h3>Say something human.</h3>
                        </div>
                        <button type="button" onClick={() => setNoteOpen(false)} aria-label="Close private note form">×</button>
                      </header>
                      <label htmlFor={`private-note-${entry.id}`}>
                        Your note
                        <textarea
                          id={`private-note-${entry.id}`}
                          value={noteBody}
                          maxLength={2000}
                          rows={6}
                          autoFocus
                          onChange={event => setNoteBody(event.target.value)}
                          placeholder={`A private note for ${identity}…`}
                        />
                      </label>
                      <div>
                        <p>Delivered anonymously after safety review. HUMAN:HERE staff can review the sender account and note for moderation.</p>
                        <span>{noteBody.length.toLocaleString()} / 2,000</span>
                      </div>
                      {noteError && <p className="human-story-action-error" role="alert">{noteError}</p>}
                      <button type="submit" disabled={notePending || !noteBody.trim()}>{notePending ? "Sending…" : "Send private note →"}</button>
                    </form>
                  )}

                  {noteSubmitted && (
                    <div className="human-story-note-success" role="status">
                      <span>Note received</span>
                      <p>Your note is awaiting moderation. If approved, it will be delivered anonymously to {identity}.</p>
                      <button type="button" onClick={() => { setNoteSubmitted(false); setNoteOpen(false); }}>Done</button>
                    </div>
                  )}
                </>
              )}
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
