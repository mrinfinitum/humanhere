import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountLink } from "@/components/AccountLink";
import { createDatabaseClient } from "@/lib/neon/server";

export const metadata: Metadata = { title: "People", description: "Find people on HUMAN:HERE by name or @username." };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function Results({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const raw = (await searchParams).q;
  const query = (typeof raw === "string" ? raw : "").trim().slice(0, 60);
  if (query.replace(/^@/, "").length < 2) return <p className="people-hint">Type at least two letters of a name or @username.</p>;
  const { data, error } = await (await createDatabaseClient()).rpc("search_members", { p_query: query, p_limit: 30 });
  if (error) throw new Error("Search is unavailable right now.");
  if (!data?.length) return <p className="people-hint">Nobody matches &ldquo;{query}&rdquo; yet.</p>;
  return (
    <ul className="people-results">
      {data.map(person => {
        const name = person.display_name?.trim() || `@${person.username}`;
        return (
        <li key={person.username}>
          <Link href={`/@${person.username}`}>
            <span className="post-avatar" aria-hidden="true">{name.replace("@", "").charAt(0).toUpperCase()}</span>
            <span><b>{name}</b><small>@{person.username} · {person.followers} follower{person.followers === 1 ? "" : "s"}</small>{person.bio && <em>{person.bio}</em>}</span>
          </Link>
        </li>
        );
      })}
    </ul>
  );
}

export default async function PeoplePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="member-shell account-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <nav aria-label="Site navigation"><Link href="/humans">Humans</Link><Link href="/share">Share</Link><AccountLink /></nav>
      </header>
      <div className="profile-body profile-body--single">
        <section className="profile-feed" aria-labelledby="people-title">
          <h1 id="people-title" className="feed-title">Find people</h1>
          <form className="people-search" action="/members" role="search">
            <label htmlFor="people-q" className="visually-hidden">Name or @username</label>
            <Suspense fallback={<input id="people-q" name="q" type="search" placeholder="Name or @username" />}><SearchInput searchParams={searchParams} /></Suspense>
            <button>Search</button>
          </form>
          <Suspense fallback={<p className="people-hint">Searching…</p>}><Results searchParams={searchParams} /></Suspense>
          <p className="people-hint">Anyone can look. To follow someone or send love, <Link href="/login?mode=signup">create an account</Link>.</p>
        </section>
      </div>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small>Find someone by name or @username</small></footer>
    </main>
  );
}

async function SearchInput({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).q;
  return <input id="people-q" name="q" type="search" defaultValue={typeof raw === "string" ? raw : ""} placeholder="Name or @username" autoComplete="off" maxLength={60} />;
}
