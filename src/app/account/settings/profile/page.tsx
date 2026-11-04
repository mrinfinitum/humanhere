import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { AvatarEditor } from "@/components/account/AvatarEditor";
import { getAccountRole, requireMember } from "@/lib/auth/server";
import { getAccountActivity, getMailingAddress } from "@/lib/account/queries";
import { removeMailingAddress, saveMailingAddress, updateProfile } from "../../actions";
import { SettingsFrame, SettingsLoading, SettingsNotice } from "../SettingsFrame";
import "./profile-location.css";

type Search = Promise<Record<string, string | string[] | undefined>>;

const ERRORS: Record<string, string> = {
  "username-invalid": "Usernames are 3 to 20 letters, numbers or underscores.",
  "username-reserved": "That username is reserved. Try another.",
  "username-taken": "That username is taken. Try another.",
  "address-incomplete": "Add a street address, city, state and ZIP code to save your address.",
};
const DONE: Record<string, string> = {
  saved: "Your profile is saved.",
  address: "Your mailing address is saved. Only you can see it.",
  "address-removed": "Your mailing address is removed.",
};

async function EditProfile({ searchParams }: { searchParams: Search }) {
  await connection();
  const user = await requireMember("/account/settings/profile");
  const [role, activity, address, query] = await Promise.all([getAccountRole(user.id), getAccountActivity(user.id), getMailingAddress(user.id), searchParams]);
  const name = activity.displayName?.trim() || user.name?.trim() || user.email.split("@")[0];
  const error = typeof query.error === "string" ? ERRORS[query.error] : undefined;
  return (
    <SettingsFrame role={role} current="/account/settings/profile" title="Edit profile">
      {error && <SettingsNotice tone="problem">{error}</SettingsNotice>}
      {typeof query.done === "string" && DONE[query.done] && <SettingsNotice>{DONE[query.done]}</SettingsNotice>}
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
        <div className="settings-pair">
          <div><label htmlFor="profile-city">City</label><input id="profile-city" name="city" defaultValue={activity.city ?? ""} maxLength={80} autoComplete="address-level2" placeholder="Columbus" /></div>
          <div><label htmlFor="profile-region">State</label><input id="profile-region" name="region" defaultValue={activity.region ?? ""} maxLength={80} autoComplete="address-level1" placeholder="OH" /></div>
        </div>
        <small>Optional. Shown on your profile, and it places your stories on the globe unless you give a story its own place. Anonymous stories never use it.</small>
        <button className="ig-button ig-button--primary">Save</button>
      </form>
      <form className="settings-group settings-form" action={saveMailingAddress} id="address" aria-labelledby="address-title">
        <h2 id="address-title" className="settings-subhead">Mailing address <span>Private</span></h2>
        <small>Optional. Never shown on your profile or stories. It is kept for when you ask for something to be sent to you, and only our team can see it then.</small>
        <label htmlFor="address-line1">Street address</label>
        <input id="address-line1" name="line1" defaultValue={address?.line1 ?? ""} maxLength={200} autoComplete="address-line1" />
        <label htmlFor="address-line2">Apartment, suite <span className="settings-optional">optional</span></label>
        <input id="address-line2" name="line2" defaultValue={address?.line2 ?? ""} maxLength={200} autoComplete="address-line2" />
        <div className="settings-pair settings-pair--three">
          <div><label htmlFor="address-city">City</label><input id="address-city" name="addressCity" defaultValue={address?.city ?? activity.city ?? ""} maxLength={160} autoComplete="address-level2" /></div>
          <div><label htmlFor="address-state">State</label><input id="address-state" name="addressState" defaultValue={address?.state ?? activity.region ?? ""} maxLength={160} autoComplete="address-level1" /></div>
          <div><label htmlFor="address-zip">ZIP code</label><input id="address-zip" name="postalCode" defaultValue={address?.postalCode ?? ""} maxLength={32} autoComplete="postal-code" inputMode="numeric" /></div>
        </div>
        <input type="hidden" name="country" value={address?.country || "US"} />
        <div className="settings-actions">
          <button className="ig-button ig-button--primary">Save address</button>
          {address && <button className="ig-button" formAction={removeMailingAddress} formNoValidate>Remove address</button>}
        </div>
      </form>
    </SettingsFrame>
  );
}

export default function EditProfilePage({ searchParams }: { searchParams: Search }) {
  return <Suspense fallback={<SettingsLoading />}><EditProfile searchParams={searchParams} /></Suspense>;
}
