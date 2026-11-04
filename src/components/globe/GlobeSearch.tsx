"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import type { PersonResult } from "@/app/api/people/route";

type Props = {
  /** Usernames that have a light on the globe right now. */
  onGlobe: Set<string>;
  onShowOnGlobe: (username: string) => void;
};

/**
 * Search people without leaving the globe: follow them in place, jump to
 * their light, or open their profile.
 */
export function GlobeSearch({ onGlobe, onShowOnGlobe }: Props) {
  const inputId = useId();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [pending, setPending] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = query.trim().replace(/^@/, "");
    request.current?.abort();
    if (term.length < 2) {
      const reset = window.setTimeout(() => { setPeople([]); setStatus("idle"); }, 0);
      return () => window.clearTimeout(reset);
    }
    const controller = new AbortController();
    request.current = controller;
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(`/api/people?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("search failed");
        const payload = await response.json() as { people: PersonResult[] };
        setPeople(payload.people);
        setStatus("done");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  async function toggleFollow(person: PersonResult) {
    setPending(person.username);
    const next = !person.following;
    const response = await fetch("/api/people/follow", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: person.username, follow: next }),
    }).catch(() => null);
    setPending(null);
    if (response?.status === 401) {
      router.push(`/login?mode=signup&next=${encodeURIComponent("/world")}`);
      return;
    }
    if (!response?.ok) return;
    setPeople(current => current.map(item => item.username === person.username
      ? { ...item, following: next, followers: item.followers + (next ? 1 : -1) } : item));
  }

  const term = query.trim().replace(/^@/, "");
  return (
    <section className="globe-search" aria-label="Find people">
      <form role="search" onSubmit={event => event.preventDefault()}>
        <label htmlFor={inputId} className="visually-hidden">Search people by name, @username or city</label>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <input id={inputId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find people by name, @username or city" autoComplete="off" maxLength={60} />
        {query && <button type="button" className="globe-search__clear" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
      </form>
      {term.length >= 2 && (
        <div className="globe-search__results" aria-live="polite">
          {status === "loading" && !people.length && <p className="globe-search__hint">Looking…</p>}
          {status === "error" && <p className="globe-search__hint">Search is unavailable right now.</p>}
          {status === "done" && !people.length && <p className="globe-search__hint">Nobody matches “{term}” yet.</p>}
          {people.length > 0 && (
            <ul>
              {people.map(person => (
                <li key={person.username}>
                  <Link className="globe-search__person" href={`/@${person.username}`}>
                    <Avatar name={person.name} path={person.avatarPath} size={40} />
                    <span><b>{person.name}</b><small>@{person.username}{person.place && <> · {person.place}</>}</small></span>
                  </Link>
                  <div className="globe-search__actions">
                    {onGlobe.has(person.username) && <button type="button" onClick={() => onShowOnGlobe(person.username)} aria-label={`Show ${person.name} on the globe`}>Globe</button>}
                    {!person.self && (
                      <button type="button" className={person.following ? "is-following" : "is-follow"} disabled={pending === person.username} onClick={() => void toggleFollow(person)}>
                        {person.following ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
