import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { HeartIcon } from "@/components/HeartIcon";
import type { MediaAsset } from "@/lib/archive/types";
import { requireMember } from "@/lib/auth/server";
import { resolveMediaUrl } from "@/lib/media/resolver";
import { createDatabaseClient } from "@/lib/neon/server";

export const metadata: Metadata = { title: "Following", robots: { index: false, follow: false } };

async function FeedContent() {
  await connection();
  await requireMember("/home");
  const { data, error } = await (await createDatabaseClient()).rpc("following_feed", { p_limit: 40 });
  if (error) throw new Error("Could not load your feed.");
  const posts = data ?? [];
  if (!posts.length) {
    return <div className="profile-empty"><i aria-hidden="true" /><h2>Nobody to follow yet.</h2><p>Follow people from their profile and their published stories show up here.</p><Link href="/humans">Meet the Humans →</Link></div>;
  }
  return posts.map(post => {
    const thumbnail = post.thumbnail as unknown as MediaAsset | null;
    return (
      <article className="post-card" key={post.id}>
        <header>
          <span className="post-avatar" aria-hidden="true">{(post.first_name ?? post.author_username ?? "·").charAt(0).toUpperCase()}</span>
          <div><b>{post.first_name ?? `@${post.author_username}`}</b><small><Link href={`/@${post.author_username}`}>@{post.author_username}</Link>{post.display_location && <> · {post.display_location}</>}</small></div>
        </header>
        {post.headline && <h2>{post.headline}</h2>}
        {post.story && <p>{post.story}</p>}
        {thumbnail?.kind === "image" && <figure className="post-media"><Image src={resolveMediaUrl(thumbnail, "display")} alt={thumbnail.alt} fill sizes="(max-width: 760px) 100vw, 640px" /></figure>}
        <footer>
          <span className="post-love"><HeartIcon filled={Number(post.love_count) > 0} />{Number(post.love_count ?? 0)}</span>
          <Link href={`/humans/${post.slug}`}>Open →</Link>
        </footer>
      </article>
    );
  });
}

export default function HomePage() {
  return (
    <main className="member-shell account-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <nav aria-label="Account navigation"><Link href="/humans">Humans</Link><Link href="/share">Share</Link><Link href="/account">Account</Link></nav>
      </header>
      <div className="profile-body profile-body--single">
        <section className="profile-feed" aria-labelledby="feed-title">
          <h1 id="feed-title" className="feed-title">Following</h1>
          <Suspense fallback={<p className="member-loading">Opening your feed…</p>}><FeedContent /></Suspense>
        </section>
      </div>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small>Stories from people you follow</small></footer>
    </main>
  );
}
