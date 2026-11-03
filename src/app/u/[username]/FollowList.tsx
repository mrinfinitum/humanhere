import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { createDatabaseClient, getSessionUser } from "@/lib/neon/server";
import { followMember, unfollowMember } from "./actions";
import { SiteNav } from "@/components/SiteNav";

type Direction = "followers" | "following";
type ListParams = Promise<{ username: string }>;

async function ListContent({ params, direction }: { params: ListParams; direction: Direction }) {
  await connection();
  const username = (await params).username.toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) notFound();
  const database = await createDatabaseClient();
  const { data: profile } = await database.rpc("member_profile", { p_username: username });
  const member = profile?.[0];
  if (!member) notFound();
  const total = direction === "followers" ? member.followers : member.following;
  const tabs = (
    <nav className="profile-tabs follow-tabs" aria-label="Follow lists">
      {(["followers", "following"] as const).map(list => <Link key={list} href={`/@${username}/${list}`} aria-current={list === direction ? "page" : undefined}>{list === "followers" ? "Followers" : "Following"}<b>{list === "followers" ? member.followers : member.following}</b></Link>)}
    </nav>
  );
  const heading = <header className="follow-head"><Link className="settings-back" href={`/@${username}`}><span aria-hidden="true">←</span> @{username}</Link><h1>{member.display_name?.trim() || `@${username}`}</h1></header>;

  if (!await getSessionUser()) {
    return <>{heading}{tabs}<div className="follow-body"><div className="profile-empty"><i aria-hidden="true" /><h2>{total} {direction === "followers" ? (total === 1 ? "follower" : "followers") : "following"}</h2><p>Sign in to see who they are.</p><Link href={`/login?next=${encodeURIComponent(`/@${username}/${direction}`)}`}>Sign in →</Link></div></div></>;
  }

  if (member.lists_hidden) {
    return <>{heading}{tabs}<div className="follow-body"><div className="profile-empty"><i aria-hidden="true" /><h2>@{username} keeps this list private.</h2><p>Only the totals are shown.</p></div></div></>;
  }

  const { data, error } = await database.rpc("member_follow_list", { p_username: username, p_direction: direction, p_limit: 100 });
  if (error) throw new Error("Could not load this list.");
  const people = data ?? [];
  return (
    <>
      {heading}
      {tabs}
      <div className="follow-body">
        {people.length ? <ul className="follow-list">{people.map(person => {
          const name = person.display_name?.trim() || `@${person.username}`;
          return (
            <li key={person.username}>
              <Link href={`/@${person.username}`}><Avatar name={name} path={person.avatar_path} size={48} /><span><b>{name}</b><small>@{person.username}</small></span></Link>
              {!person.is_self && (person.viewer_follows
                ? <form action={unfollowMember}><input type="hidden" name="username" value={person.username} /><button className="ig-button">Following</button></form>
                : <form action={followMember}><input type="hidden" name="username" value={person.username} /><button className="ig-button ig-button--primary">Follow</button></form>)}
            </li>
          );
        })}</ul> : <div className="profile-empty"><i aria-hidden="true" /><h2>{direction === "followers" ? "No followers yet." : "Not following anyone yet."}</h2></div>}
      </div>
    </>
  );
}

export function FollowList({ params, direction }: { params: ListParams; direction: Direction }) {
  return (
    <main className="member-shell account-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <SiteNav />
      </header>
      <Suspense fallback={<p className="member-loading">Opening this list…</p>}><ListContent params={params} direction={direction} /></Suspense>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span></footer>
    </main>
  );
}
