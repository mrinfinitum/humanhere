import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { AvatarEditor } from "@/components/account/AvatarEditor";
import { getAccountRole, requireMember } from "@/lib/auth/server";
import { getAccountActivity } from "@/lib/account/queries";
import { updateProfile } from "../../actions";
import { SettingsFrame, SettingsLoading, SettingsNotice } from "../SettingsFrame";

type Search = Promise<Record<string, string | string[] | undefined>>;

const ERRORS: Record<string, string> = {
  "username-invalid": "Usernames are 3 to 20 letters, numbers or underscores.",
  "username-reserved": "That username is reserved. Try another.",
  "username-taken": "That username is taken. Try another.",
};

async function EditProfile({ searchParams }: { searchParams: Search }) {
  await connection();
  const user = await requireMember("/account/settings/profile");
  const [role, activity, query] = await Promise.all([getAccountRole(user.id), getAccountActivity(user.id), searchParams]);
  const name = activity.displayName?.trim() || user.name?.trim() || user.email.split("@")[0];
  const error = typeof query.error === "string" ? ERRORS[query.error] : undefined;
  return (
    <SettingsFrame role={role} current="/account/settings/profile" title="Edit profile">
      {error && <SettingsNotice tone="problem">{error}</SettingsNotice>}
      {query.done === "saved" && <SettingsNotice>Your profile is saved.</SettingsNotice>}
      <section className="settings-group settings-photo">
        <Avatar name={name} path={activity.avatarPath} size={96} />
        <div><b>Profile photo</b><small>Everyone can see it on your profile and stories.</small><AvatarEditor current={activity.avatarPath} name={name} /></div>
      </section>
      <form className="settings-group settings-form" action={updateProfile}>
        <input type="hidden" name="currentUsername" value={activity.username ?? ""} />
        <label htmlFor="profile-display-name">Name</label>
        <input id="profile-display-name" name="displayName" defaultValue={activity.displayName ?? ""} maxLength={80} autoComplete="name" placeholder={name} />
        <label htmlFor="profile-username">Username</label>
        <div className="settings-prefixed"><span aria-hidden="true">@</span><input id="profile-username" name="username" defaultValue={activity.username ?? ""} minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" required autoComplete="username" /></div>
        <small>Your profile lives at humanhere.co/@{activity.username ?? "username"}.</small>
        <label htmlFor="profile-bio">Bio</label>
        <textarea id="profile-bio" name="bio" defaultValue={activity.bio ?? ""} maxLength={160} rows={3} placeholder="A line about you" />
        <small>Up to 160 characters.</small>
        <button className="ig-button ig-button--primary">Save</button>
      </form>
    </SettingsFrame>
  );
}

export default function EditProfilePage({ searchParams }: { searchParams: Search }) {
  return <Suspense fallback={<SettingsLoading />}><EditProfile searchParams={searchParams} /></Suspense>;
}
