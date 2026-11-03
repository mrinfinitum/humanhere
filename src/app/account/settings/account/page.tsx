import { connection } from "next/server";
import { Suspense } from "react";
import { getNeonAuth } from "@/lib/auth/neon";
import { getAccountRole, requireMember } from "@/lib/auth/server";
import { changePassword, sendPasswordSetupLink, signOutOtherDevices } from "../actions";
import { SettingsFrame, SettingsLoading, SettingsNotice } from "../SettingsFrame";

type Search = Promise<Record<string, string | string[] | undefined>>;

const PROBLEMS: Record<string, string> = {
  "password-short": "Use at least 10 characters for your new password.",
  "password-long": "Use 128 characters or fewer.",
  mismatch: "The new passwords do not match.",
  "current-password": "Your current password is not right.",
  "password-service": "Your password could not be changed right now. Try again soon.",
  sessions: "Your other devices could not be signed out right now. Try again soon.",
};
const DONE: Record<string, string> = {
  password: "Your password is changed.",
  sessions: "You are signed out everywhere except here.",
  "link-sent": "Check your email for a link to set your password.",
  "link-failed": "The email could not be sent right now. Try again soon.",
};

async function AccountSettings({ searchParams }: { searchParams: Search }) {
  await connection();
  const user = await requireMember("/account/settings/account");
  const [role, accounts, query] = await Promise.all([getAccountRole(user.id), getNeonAuth().listAccounts(), searchParams]);
  const hasPassword = (accounts.data ?? []).some(account => account.providerId === "credential");
  const others = (accounts.data ?? []).filter(account => account.providerId !== "credential").map(account => account.providerId);
  const problem = typeof query.problem === "string" ? PROBLEMS[query.problem] : undefined;
  const done = typeof query.done === "string" ? DONE[query.done] : undefined;
  return (
    <SettingsFrame role={role} current="/account/settings/account" title="Account">
      {problem && <SettingsNotice tone="problem">{problem}</SettingsNotice>}
      {done && <SettingsNotice tone={query.done === "link-failed" ? "problem" : "done"}>{done}</SettingsNotice>}

      <section className="settings-group">
        <h2>Email</h2>
        <dl className="settings-rows">
          <div><dt>Signed in as</dt><dd>{user.email}</dd></div>
          <div><dt>Sign-in methods</dt><dd>{[hasPassword && "Password", "Email link", ...others.map(id => id.charAt(0).toUpperCase() + id.slice(1))].filter(Boolean).join(", ")}</dd></div>
        </dl>
        <small>Your email is never shown publicly.</small>
      </section>

      <section className="settings-group">
        <h2>{hasPassword ? "Change password" : "Set a password"}</h2>
        {hasPassword ? (
          <form className="settings-form" action={changePassword}>
            <label htmlFor="current-password">Current password</label>
            <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} />
            <label htmlFor="new-password">New password</label>
            <input id="new-password" name="newPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={128} />
            <label htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" name="confirm" type="password" autoComplete="new-password" required minLength={10} maxLength={128} />
            <label className="settings-check"><input type="checkbox" name="signOutOthers" defaultChecked /> Sign out of my other devices</label>
            <button className="ig-button ig-button--primary">Change password</button>
          </form>
        ) : (
          <form className="settings-form" action={sendPasswordSetupLink}>
            <p>You sign in with a link sent to your email. To sign in with a password as well, we will email you a link to set one.</p>
            <button className="ig-button">Email me a link</button>
          </form>
        )}
      </section>

      <section className="settings-group">
        <h2>Devices</h2>
        <form className="settings-form" action={signOutOtherDevices}>
          <p>Lost a phone or used a shared computer? Sign out everywhere except this device.</p>
          <button className="ig-button">Sign out of other devices</button>
        </form>
      </section>
    </SettingsFrame>
  );
}

export default function AccountSettingsPage({ searchParams }: { searchParams: Search }) {
  return <Suspense fallback={<SettingsLoading />}><AccountSettings searchParams={searchParams} /></Suspense>;
}
