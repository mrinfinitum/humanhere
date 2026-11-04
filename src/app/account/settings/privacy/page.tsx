import { connection } from "next/server";
import { Suspense } from "react";
import { getAccountRole, requireMember } from "@/lib/auth/server";
import { getAccountActivity } from "@/lib/account/queries";
import { submissionRepository } from "@/lib/submissions/repository";
import { revokeConsent, updateFollowListPrivacy, updateSocialSharing } from "../../actions";
import { STATUS_LABELS, timeAgo } from "../../AccountView";
import { SettingsFrame, SettingsLoading } from "../SettingsFrame";
import { storyLabel } from "@/lib/posts/label";

const PERMISSION_LABELS = [
  ["publishStory", "Show my story publicly"],
  ["publishMedia", "Show my photos, video or audio publicly"],
  ["socialReuse", "Share my story on HUMAN:HERE social media"],
  ["mayContact", "Contact me about my story"],
  ["partnerReferral", "Refer me to partner organisations"],
] as const;

async function PrivacySettings() {
  await connection();
  const user = await requireMember("/account/settings/privacy");
  const [role, activity, submissions] = await Promise.all([getAccountRole(user.id), getAccountActivity(user.id), submissionRepository.listOwned(user.id)]);
  const storiesWithPermissions = submissions.flatMap(story => activity.permissions[story.id] ? [{ story, permissions: activity.permissions[story.id] }] : []);
  return (
    <SettingsFrame role={role} current="/account/settings/privacy" title="Privacy & sharing">
      <section className="settings-group">
        <h2>Who can see your content</h2>
        <dl className="settings-rows">
          <div><dt>Drafts</dt><dd>Only you</dd></div>
          <div><dt>Stories the automatic check holds</dt><dd>You and our team, until we publish or decline them</dd></div>
          <div><dt>Published stories</dt><dd>Everyone, as soon as you share them. Stories you did not post anonymously also appear on your profile</dd></div>
          <div><dt>Your profile</dt><dd>Everyone: your photo, @username, name, bio, level and follower counts</dd></div>
          <div><dt>Who follows you, and who you follow</dt><dd>{activity.hideFollowLists ? "Only you. Others see only the totals" : "Signed-in members. Visitors who are not signed in see only the totals"}</dd></div>
          <div><dt>Notes sent to you</dt><dd>Only you, once our moderators approve them</dd></div>
          <div><dt>Humans you love</dt><dd>Only you. Others see a total count, never your name</dd></div>
          <div><dt>Your email address</dt><dd>Never shown publicly</dd></div>
        </dl>
      </section>

      <section className="settings-group">
        <h2>Followers and following</h2>
        <form className="settings-toggle" action={updateFollowListPrivacy}>
          <input type="hidden" name="hideFollowLists" value={activity.hideFollowLists ? "" : "on"} />
          <span><b>Hide who I follow and who follows me</b><small>Others see only your totals, and you are left out of other people&rsquo;s lists too. You still see your own.</small></span>
          <button className={`switch${activity.hideFollowLists ? " switch--on" : ""}`} role="switch" aria-checked={activity.hideFollowLists} aria-label="Hide who I follow and who follows me"><i /></button>
        </form>
      </section>

      <section className="settings-group">
        <h2>Social media</h2>
        <p>Sharing a story publishes it straight away, with the photos, video or audio you added. We contact you or connect you with a partner only when you ask for that kind of help.</p>
        <form className="settings-toggle" action={updateSocialSharing}>
          <input type="hidden" name="allowSocialReuse" value={activity.allowSocialReuse ? "" : "on"} />
          <span><b>Feature my stories on HUMAN:HERE social media</b><small>Applies to stories you submit from now on.</small></span>
          <button className={`switch${activity.allowSocialReuse ? " switch--on" : ""}`} role="switch" aria-checked={activity.allowSocialReuse} aria-label="Feature my stories on HUMAN:HERE social media"><i /></button>
        </form>
      </section>

      {storiesWithPermissions.length > 0 && (
        <section className="settings-group">
          <h2>What each story allows</h2>
          {storiesWithPermissions.map(({ story, permissions }) => (
            <article className="settings-story" key={story.id}>
              <header><b>{storyLabel(story.headline, story.story)}</b><small>{permissions.revokedAt ? `Turned off ${timeAgo(permissions.revokedAt)}` : STATUS_LABELS[story.status]}</small></header>
              <ul>{PERMISSION_LABELS.map(([key, label]) => {
                const allowed = permissions[key] && !permissions.revokedAt;
                return <li key={key}><span>{label}</span><b className={allowed ? "settings-on" : undefined}>{allowed ? "On" : "Off"}</b></li>;
              })}</ul>
              {story.status === "published" && <form action={revokeConsent}><input type="hidden" name="submissionId" value={story.id} /><button className="ig-button">Turn off all and unpublish</button><small>Takes effect right away and removes your public photos, video and audio.</small></form>}
            </article>
          ))}
        </section>
      )}
    </SettingsFrame>
  );
}

export default function PrivacySettingsPage() {
  return <Suspense fallback={<SettingsLoading />}><PrivacySettings /></Suspense>;
}
