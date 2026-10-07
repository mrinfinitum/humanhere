import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { HeartIcon } from "@/components/HeartIcon";
import type { AccountActivity } from "@/lib/account/queries";
import { resolveMediaUrl } from "@/lib/media/resolver";
import type { SubmissionDraft, SubmissionStatus } from "@/lib/submissions/types";
import { deleteStory, editStory, revokeConsent, updateDisplayName, updateReceivedNote } from "./actions";

export const ACCOUNT_TABS = ["stories", "notes", "loved", "privacy"] as const;
export type AccountTab = (typeof ACCOUNT_TABS)[number];

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: "Private draft", submitted: "Sent for review", in_review: "In review", contacted: "We reached out",
  approved: "Approved", rejected: "Not published", published: "Published", archived: "Archived",
};

const PERMISSION_LABELS = [
  ["publishStory", "Show my story publicly"],
  ["publishMedia", "Show my photos, video or audio publicly"],
  ["socialReuse", "Share my story on HUMAN:HERE social media"],
  ["mayContact", "Contact me about my story"],
  ["partnerReferral", "Refer me to partner organisations"],
] as const;

function timeAgo(value: string) {
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

export function AccountView({ email, error, fallbackName, role, tab, submissions, activity }: AccountViewProps) {
  const isStaff = role !== "user";
  const name = activity.displayName?.trim() || fallbackName.trim() || email.split("@")[0];
  const initial = name.charAt(0).toUpperCase();
  const unreadNotes = activity.notes.filter(note => !note.readAt).length;
  const loveReceived = Object.values(activity.published).reduce((total, story) => total + story.loveCount, 0);
  const storiesWithPermissions = submissions.flatMap(story => activity.permissions[story.id] ? [{ story, permissions: activity.permissions[story.id] }] : []);
  const tabs: Array<{ id: AccountTab; label: string; count?: number }> = [
    { id: "stories", label: "Stories", count: submissions.length },
    { id: "notes", label: "Notes", count: unreadNotes },
    { id: "loved", label: "Loved", count: activity.loved.length },
    { id: "privacy", label: "Privacy" },
  ];

  return (
    <main className="member-shell account-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="member-header">
        <Link className="member-wordmark" href="/" aria-label="HUMAN:HERE home">HUMAN<span>:</span>HERE</Link>
        <nav aria-label="Account navigation"><Link href="/humans">Humans</Link>{isStaff && <Link className="member-admin-link" href="/admin">Admin</Link>}<form action={signOut}><button>Sign out</button></form></nav>
      </header>

      <section className="profile-head" aria-labelledby="profile-name">
        <span className="profile-avatar" aria-hidden="true">{initial}</span>
        <div className="profile-identity">
          <h1 id="profile-name">{name}</h1>
          <p>{email}{activity.joinedAt && <> · Joined {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(activity.joinedAt))}</>}</p>
          <span className="profile-badge"><i aria-hidden="true" />{isStaff ? `${role} access` : "Private member"}</span>
        </div>
        <div className="profile-actions">
          <Link className="profile-primary" href="/share">Share a story <b aria-hidden="true">+</b></Link>
          <details className="profile-edit">
            <summary>Edit name</summary>
            <form action={updateDisplayName}>
              <label htmlFor="profile-display-name">Name shown on your page</label>
              <input id="profile-display-name" name="displayName" defaultValue={activity.displayName ?? ""} maxLength={80} autoComplete="name" placeholder={name} />
              <button>Save</button>
            </form>
          </details>
        </div>
        <dl className="profile-stats">
          <div><dd>{submissions.length}</dd><dt>Stories</dt></div>
          <div><dd>{Object.keys(activity.published).length}</dd><dt>Published</dt></div>
          <div><dd>{loveReceived}</dd><dt>Love received</dt></div>
          <div><dd>{activity.notes.length}</dd><dt>Notes</dt></div>
        </dl>
      </section>

      <nav className="profile-tabs" aria-label="Account sections">
        {tabs.map(item => <Link key={item.id} href={item.id === "stories" ? "/account" : `/account?tab=${item.id}`} scroll={false} aria-current={item.id === tab ? "page" : undefined}>{item.label}{Boolean(item.count) && <b>{item.count}</b>}</Link>)}
      </nav>

      <div className="profile-body">
        <section className="profile-feed" aria-label={tabs.find(item => item.id === tab)?.label}>
          {error && ERRORS[error] && <p className="profile-notice" role="alert">{ERRORS[error]}</p>}
          {tab === "stories" && (submissions.length ? submissions.map(item => {
            const published = activity.published[item.id];
            return (
              <article className="post-card" key={item.id}>
                <header>
                  <span className="post-avatar" aria-hidden="true">{item.anonymous ? "·" : initial}</span>
                  <div><b>{item.anonymous ? "Anonymous" : item.publicName ?? name}</b><small>{timeAgo(item.updatedAt)}{item.location && <> · {item.location}</>}</small></div>
                  <span className={`post-status post-status--${item.status}`}>{STATUS_LABELS[item.status]}</span>
                </header>
                <h2>{item.headline ?? "Untitled story"}</h2>
                {item.story && <p>{item.story}</p>}
                <footer>
                  {published && <span className="post-love"><HeartIcon filled={published.loveCount > 0} />{published.loveCount}</span>}
                  {published && <Link href={`/humans/${published.slug}`}>View story →</Link>}
                  {item.status === "draft" ? <Link href={`/share?draft=${item.id}`}>Continue writing →</Link> : (
                    <details className="post-confirm">
                      <summary>Edit</summary>
                      <form action={editStory}><input type="hidden" name="submissionId" value={item.id} /><p>{published ? "Editing takes this story off the site and moves it back to a private draft. It returns after you resubmit and we review it." : "Editing moves this story back to a private draft. Resubmit it when you are ready."}</p><button>Edit story</button></form>
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
          }) : <div className="profile-empty"><i aria-hidden="true" /><h2>When you are ready,<br />there is room for you.</h2><p>Nothing becomes public without review and explicit consent.</p><Link href="/share">Begin privately →</Link></div>)}

          {tab === "notes" && (activity.notes.length ? activity.notes.map(note => (
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
          )) : <div className="profile-empty"><i aria-hidden="true" /><h2>No notes yet.</h2><p>When someone sends encouragement to one of your published stories, it arrives here after review. Senders stay private.</p></div>)}

          {tab === "loved" && (activity.loved.length ? <div className="loved-grid">{activity.loved.map(human => (
            <Link className="loved-card" href={`/humans/${human.slug}`} key={human.id}>
              <figure>{human.thumbnail?.kind === "image" ? <Image src={resolveMediaUrl(human.thumbnail, "thumbnail")} alt={human.thumbnail.alt} fill sizes="(max-width: 760px) 50vw, 240px" style={{ objectPosition: human.thumbnail.objectPosition }} /> : <span aria-hidden="true">{human.name.charAt(0)}</span>}</figure>
              <b>{human.name}</b>
              <small>{human.location ?? human.headline}</small>
              <span className="post-love"><HeartIcon filled />{human.loveCount}</span>
            </Link>
          ))}</div> : <div className="profile-empty"><i aria-hidden="true" /><h2>Nobody here yet.</h2><p>Send love to a Human and they will be kept here for you.</p><Link href="/humans">Meet the Humans →</Link></div>)}

          {tab === "privacy" && (
            <>
              <article className="post-card settings-card">
                <h2>Who can see your content</h2>
                <dl>
                  <div><dt>Drafts</dt><dd>Only you</dd></div>
                  <div><dt>Stories you submit</dt><dd>You and our review team</dd></div>
                  <div><dt>Published stories</dt><dd>Everyone</dd></div>
                  <div><dt>Notes sent to you</dt><dd>Only you, once our moderators approve them</dd></div>
                  <div><dt>Humans you love</dt><dd>Only you. Others see a total count, never your name</dd></div>
                  <div><dt>Your email address</dt><dd>Never shown publicly</dd></div>
                </dl>
              </article>

              <article className="post-card settings-card">
                <h2>Your permissions</h2>
                <p>You choose these each time you submit a story. Nothing is published until you say yes and our team has reviewed it.</p>
                {storiesWithPermissions.length ? storiesWithPermissions.map(({ story, permissions }) => (
                  <section key={story.id}>
                    <header><b>{story.headline ?? "Untitled story"}</b><small>{permissions.revokedAt ? `Turned off ${timeAgo(permissions.revokedAt)}` : STATUS_LABELS[story.status]}</small></header>
                    <ul>{PERMISSION_LABELS.map(([key, label]) => {
                      const allowed = permissions[key] && !permissions.revokedAt;
                      return <li key={key}><span>{label}</span><b className={allowed ? "settings-on" : undefined}>{allowed ? "On" : "Off"}</b></li>;
                    })}</ul>
                    {story.status === "published" && <form action={revokeConsent}><input type="hidden" name="submissionId" value={story.id} /><button>Turn off all and unpublish</button><small>Takes effect right away and removes your public photos, video and audio.</small></form>}
                  </section>
                )) : <p className="settings-empty">You have not given any permissions yet. We will ask when you submit a story.</p>}
              </article>

              <article className="post-card settings-card">
                <h2>Remove your content</h2>
                <dl>
                  <div><dt>Edit, unpublish or delete a story</dt><dd><Link href="/account">Go to your stories →</Link></dd></div>
                  <div><dt>Ask us to remove something for you</dt><dd><Link href="/remove-my-story">Send a request →</Link></dd></div>
                </dl>
              </article>

              <article className="post-card settings-card">
                <h2>Account</h2>
                <dl>
                  <div><dt>Signed in as</dt><dd>{email}</dd></div>
                  <div><dt>Terms of Use</dt><dd><Link href="/terms">Read →</Link></dd></div>
                  <div><dt>Privacy Policy</dt><dd><Link href="/privacy">Read →</Link></dd></div>
                </dl>
                <footer><form action={signOut}><button>Sign out</button></form></footer>
              </article>
            </>
          )}
        </section>

        <aside className="profile-rail" aria-label="Your private space">
          <section><p className="eyebrow">Your story stays yours</p><p>Only you see drafts, notes, and the Humans you love. Review and explicit consent come before anything is public.</p><Link href="/account?tab=privacy" scroll={false}>Your choices →</Link></section>
          <section><p className="eyebrow">Keep exploring</p><Link href="/humans">Meet the Humans →</Link><Link href="/">Return to the globe →</Link></section>
        </aside>
      </div>

      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small>Your private space · Your choices</small></footer>
    </main>
  );
}
