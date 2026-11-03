import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { HeartIcon } from "@/components/HeartIcon";
import { RankBadge } from "@/components/RankBadge";
import { memberLevel } from "@/lib/account/levels";
import type { MediaAsset } from "@/lib/archive/types";
import { resolveMediaUrl } from "@/lib/media/resolver";
import { createDatabaseClient } from "@/lib/neon/server";
import { followMember, unfollowMember } from "./actions";

type ProfileParams = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: ProfileParams }): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username.toLowerCase()}`, alternates: { canonical: `/@${username.toLowerCase()}` } };
}

async function ProfileContent({ params }: { params: ProfileParams }) {
  await connection();
  const username = (await params).username.toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) notFound();
  // Visibility depends on who is looking, so this is read per visitor, never from a shared cache.
  const database = await createDatabaseClient();
  const { data, error } = await database.rpc("member_profile", { p_username: username });
  if (error) throw new Error("Could not load this profile.");
  const member = data?.[0];
  if (!member) notFound();
  const { data: stories } = await database.from("human_entries_public").select("id,slug,headline,story,thumbnail,love_count,published_at,display_location")
    .eq("author_username", username).order("published_at", { ascending: false }).limit(40);
  const posts = stories ?? [];
  const name = member.display_name?.trim() || `@${member.username}`;
  const level = memberLevel(member);
  const joined = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(member.joined_at));

  return (
    <>
      <section className="profile-head" aria-labelledby="member-name">
        <span className="profile-avatar" aria-hidden="true">{name.replace("@", "").charAt(0).toUpperCase()}</span>
        <div className="profile-identity">
          <h1 id="member-name">{name}<RankBadge rank={level.rank} /></h1>
          <p className="profile-handle">@{member.username}</p>
          {member.bio && <p className="profile-bio">{member.bio}</p>}
          <p>Joined {joined}</p>
        </div>
        <div className="profile-actions">
          {member.is_self ? <Link className="profile-secondary" href="/account">Edit profile</Link>
            : member.viewer_follows ? <form action={unfollowMember}><input type="hidden" name="username" value={member.username} /><button className="profile-secondary">Following</button></form>
              : <form action={followMember}><input type="hidden" name="username" value={member.username} /><button className="profile-primary">Follow</button></form>}
        </div>
        <dl className="profile-stats">
          <div><dd>{posts.length}</dd><dt>Stories</dt></div>
          <div><dd>{member.followers}</dd><dt>Followers</dt></div>
          <div><dd>{member.following}</dd><dt>Following</dt></div>
        </dl>
        <div className="profile-level">
          <p><RankBadge rank={level.rank} /><b>Level {level.level}</b><span>{level.rank}</span><small>{level.experience} experience</small></p>
          <progress value={level.progress} max={level.needed} aria-label={`${level.progress} of ${level.needed} experience to level ${level.level + 1}`} />
        </div>
      </section>
      <div className="profile-body profile-body--single">
        <section className="profile-feed" aria-label="Stories">
          {posts.length ? posts.map(post => {
              const thumbnail = post.thumbnail as unknown as MediaAsset | null;
              return (
                <Link className="post-card post-card--link" href={`/humans/${post.slug}`} key={post.id}>
                  <header><div><b>{name}</b><small>@{member.username}{post.display_location && <> · {post.display_location}</>}</small></div></header>
                  {post.headline && <h2>{post.headline}</h2>}
                  {post.story && <p>{post.story}</p>}
                  {thumbnail?.kind === "image" && <figure className="post-media"><Image src={resolveMediaUrl(thumbnail, "display")} alt={thumbnail.alt} fill sizes="(max-width: 760px) 100vw, 640px" /></figure>}
                  <footer><span className="post-love"><HeartIcon filled={Number(post.love_count) > 0} />{Number(post.love_count ?? 0)}</span></footer>
                </Link>
              );
          }) : <div className="profile-empty"><i aria-hidden="true" /><h2>No published stories yet.</h2></div>}
        </section>
      </div>
    </>
  );
}

export default function ProfilePage({ params }: { params: ProfileParams }) {
  return (
    <main className="member-shell account-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <nav aria-label="Site navigation"><Link href="/home">Following</Link><Link href="/humans">Humans</Link><Link href="/account">Account</Link></nav>
      </header>
      <Suspense fallback={<p className="member-loading">Opening this profile…</p>}><ProfileContent params={params} /></Suspense>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small>Levels grow by showing love and giving</small></footer>
    </main>
  );
}
