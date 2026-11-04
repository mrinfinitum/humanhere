import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { HeartIcon } from "@/components/HeartIcon";
import { RankBadge } from "@/components/RankBadge";
import { ShareProfileButton } from "@/components/account/ShareProfileButton";
import { formatPlace, type AccountActivity } from "@/lib/account/queries";
import { resolveMediaUrl } from "@/lib/media/resolver";
import type { SubmissionDraft, SubmissionStatus } from "@/lib/submissions/types";
import { EXPERIENCE_PER } from "@/lib/account/levels";
import { MemberHeader } from "./MemberHeader";
import { deleteStory, editStory, revokeConsent, updateReceivedNote } from "./actions";

export const ACCOUNT_TABS = ["stories", "notes", "loved"] as const;
export type AccountTab = (typeof ACCOUNT_TABS)[number];

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: "Private draft", submitted: "Posting", in_review: "Waiting for a check", contacted: "We reached out",
  approved: "Approved", rejected: "Not published", published: "Published", archived: "Archived",
};

export function timeAgo(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]] as const) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

const ERRORS: Record<string, string> = {
  "delete-blocked": "This story has help in progress, so it cannot be deleted yet. Contact us and we will remove it for you.",
};

type AccountViewProps = {
  email: string;
  error?: string;
  fallbackName: string;
  role: string;
  tab: AccountTab;
  submissions: SubmissionDraft[];
  activity: AccountActivity;
};

function GearIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
}

export function AccountView({ email, error, fallbackName, role, tab, submissions, activity }: AccountViewProps) {
  const name = activity.displayName?.trim() || fallbackName.trim() || email.split("@")[0];
  const { level } = activity;
  const place = formatPlace(activity.city, activity.region);
  const unreadNotes = activity.notes.filter(note => !note.readAt).length;
  const tabs: Array<{ id: AccountTab; label: string; count?: number }> = [
    { id: "stories", label: "Stories" },
    { id: "notes", label: "Notes", count: unreadNotes },
    { id: "loved", label: "Loved" },
  ];
  const followHref = (list: "followers" | "following") => activity.username ? `/@${activity.username}/${list}` : "/account/settings/profile";

  return (
    <main className="member-shell account-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <MemberHeader role={role} />

      <section className="ig-head" aria-labelledby="profile-name">
        <Link className="ig-head__avatar" href="/account/settings/profile" aria-label="Change your profile photo"><Avatar name={name} path={activity.avatarPath} size={132} /></Link>
        <div className="ig-head__main">
          <div className="ig-head__title">
            <h1 id="profile-name">{name}<RankBadge rank={level.rank} /></h1>
            <Link className="ig-gear" href="/account/settings" aria-label="Settings"><GearIcon /></Link>
          </div>
          {activity.username && <p className="ig-handle">@{activity.username}{place && <span className="ig-place"> · {place}</span>}</p>}
          <dl className="ig-stats">
            <div><dd>{submissions.length}</dd><dt>stories</dt></div>
            <Link href={followHref("followers")}><dd>{activity.followers}</dd><dt>followers</dt></Link>
            <Link href={followHref("following")}><dd>{activity.following}</dd><dt>following</dt></Link>
          </dl>
          {activity.bio && <p className="ig-bio">{activity.bio}</p>}
          <details className="ig-level">
            <summary><RankBadge rank={level.rank} /><b>Level {level.level} · {level.rank}</b><progress value={level.progress} max={level.needed} aria-label={`${level.progress} of ${level.needed} experience to level ${level.level + 1}`} /><small>{level.needed - level.progress} to go</small></summary>
            <p>{level.experience} experience. {level.nextRank ? <>{level.nextRank.name} at level {level.nextRank.level}. </> : null}Earn {EXPERIENCE_PER.loves} for each Human you love, {EXPERIENCE_PER.notes} for each note once it is approved, and {EXPERIENCE_PER.gifts} for each gift.</p>
          </details>
          <div className="ig-actions">
            <Link className="ig-button" href="/account/settings/profile">Edit profile</Link>
            {activity.username && <ShareProfileButton className="ig-button" username={activity.username} />}
            <Link className="ig-button ig-button--primary" href="/share">Share a story</Link>
          </div>
        </div>
      </section>

      <nav className="profile-tabs ig-tabs" aria-label="Account sections">
        {tabs.map(item => <Link key={item.id} href={item.id === "stories" ? "/account" : `/account?tab=${item.id}`} scroll={false} aria-current={item.id === tab ? "page" : undefined}>{item.label}{Boolean(item.count) && <b>{item.count}</b>}</Link>)}
      </nav>

      <div className="ig-body">
        {error && ERRORS[error] && <p className="profile-notice" role="alert">{ERRORS[error]}</p>}
        {tab === "stories" && (submissions.length ? <div className="story-grid">{submissions.map(item => {
          const published = activity.published[item.id];
          return (
            <article className={`story-tile story-tile--${item.status}`} key={item.id}>
              <header><span className={`post-status post-status--${item.status}`}>{STATUS_LABELS[item.status]}</span><small>{timeAgo(item.updatedAt)}</small></header>
              {item.headline?.trim() ? <>
                <h2>{published ? <Link href={`/humans/${published.slug}`}>{item.headline}</Link> : item.headline}</h2>
                {item.story && <p>{item.story}</p>}
              </> : item.story?.trim() ? (
                // No title, like a post on X: the story's own words lead the tile.
                <p className="story-tile-lead">{published ? <Link href={`/humans/${published.slug}`}>{item.story}</Link> : item.story}</p>
              ) : <p className="story-tile-empty">Nothing written yet.</p>}
              <footer>
                {published && <span className="post-love"><HeartIcon filled={published.loveCount > 0} />{published.loveCount}</span>}
                {item.anonymous && <small>Anonymous</small>}
                {item.status === "draft" ? <Link href={`/share?draft=${item.id}`}>Continue →</Link> : (
                  <details className="post-confirm">
                    <summary>Edit</summary>
                    <form action={editStory}><input type="hidden" name="submissionId" value={item.id} /><p>{published ? "Editing takes this story off the site and moves it back to a private draft. It goes live again, at the same link, when you share it." : "Editing moves this story back to a private draft. Share it again when you are ready."}</p><button>Edit story</button></form>
                  </details>
                )}
                {item.status === "published" && (
                  <details className="post-confirm">
                    <summary>Unpublish</summary>
                    <form action={revokeConsent}><input type="hidden" name="submissionId" value={item.id} /><p>This takes your story off the site right away and removes its public photos, video and audio. Your private copy stays here.</p><button>Unpublish</button></form>
                  </details>
                )}
                <details className="post-confirm post-confirm--danger">
                  <summary>Delete</summary>
                  <form action={deleteStory}><input type="hidden" name="submissionId" value={item.id} /><p>This permanently deletes the story, its files and its permissions{published ? ", and takes it off the site" : ""}. It cannot be undone.</p><button>Delete permanently</button></form>
                </details>
              </footer>
            </article>
          );
        })}</div> : <div className="profile-empty"><i aria-hidden="true" /><h2>When you are ready,<br />there is room for you.</h2><p>Drafts stay private. A story posts when you share it, and you can unpublish it any time.</p><Link href="/share">Begin privately →</Link></div>)}

        {tab === "notes" && (activity.notes.length ? <div className="profile-feed">{activity.notes.map(note => (
          <article className={`post-card note-card${note.readAt ? "" : " note-card--unread"}`} key={note.id}>
            <header>
              <span className="post-avatar" aria-hidden="true"><HeartIcon filled /></span>
              <div><b>Someone wrote to you</b><small>{timeAgo(note.createdAt)} · <Link href={`/humans/${note.storySlug}`}>on your story</Link></small></div>
              {!note.readAt && <span className="post-status post-status--published">New</span>}
            </header>
            <p>{note.body}</p>
            <footer>
              {(["read", "hide", "report"] as const).filter(action => action !== "read" || !note.readAt).map(action => (
                <form action={updateReceivedNote} key={action}><input type="hidden" name="noteId" value={note.id} /><input type="hidden" name="action" value={action} /><button>{action === "read" ? "Mark as read" : action === "hide" ? "Hide" : "Report"}</button></form>
              ))}
            </footer>
          </article>
        ))}</div> : <div className="profile-empty"><i aria-hidden="true" /><h2>No notes yet.</h2><p>When someone sends encouragement to one of your published stories, it arrives here after review. Senders stay private.</p></div>)}

        {tab === "loved" && (activity.loved.length ? <div className="loved-grid">{activity.loved.map(human => (
          <Link className="loved-card" href={`/humans/${human.slug}`} key={human.id}>
            <figure>{human.thumbnail?.kind === "image" ? <Image src={resolveMediaUrl(human.thumbnail, "thumbnail")} alt={human.thumbnail.alt} fill sizes="(max-width: 760px) 50vw, 240px" style={{ objectPosition: human.thumbnail.objectPosition }} /> : <span aria-hidden="true">{human.name.charAt(0)}</span>}</figure>
            <b>{human.name}</b>
            <small>{human.location ?? human.headline}</small>
            <span className="post-love"><HeartIcon filled />{human.loveCount}</span>
          </Link>
        ))}</div> : <div className="profile-empty"><i aria-hidden="true" /><h2>Nobody here yet.</h2><p>Send love to a Human and they will be kept here for you.</p><Link href="/world">Meet the Humans →</Link></div>)}
      </div>

      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small>Your private space · <Link href="/account/settings/privacy">Your choices</Link></small></footer>
    </main>
  );
}
