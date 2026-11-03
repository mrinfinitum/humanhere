import { connection } from "next/server";
import { Suspense } from "react";
import { getAccountRole, requireMember } from "@/lib/auth/server";
import { getAccountActivity } from "@/lib/account/queries";
import { deleteAccount } from "../actions";
import { SettingsFrame, SettingsLoading, SettingsNotice } from "../SettingsFrame";

type Search = Promise<Record<string, string | string[] | undefined>>;

const PROBLEMS: Record<string, string> = {
  confirm: "Type your username exactly to confirm.",
  "help-in-progress": "One of your stories has help in progress, so your account cannot be deleted yet. Contact us and we will close it for you.",
  "contact-us": "Your stories are deleted, but your account needs our help to finish. Contact us and we will remove it.",
};

async function DeleteAccount({ searchParams }: { searchParams: Search }) {
  await connection();
  const user = await requireMember("/account/settings/delete");
  const [role, activity, query] = await Promise.all([getAccountRole(user.id), getAccountActivity(user.id), searchParams]);
  const confirmWord = activity.username ?? user.email;
  const problem = typeof query.problem === "string" ? PROBLEMS[query.problem] : undefined;
  return (
    <SettingsFrame role={role} current="/account/settings/delete" title="Delete account">
      {problem && <SettingsNotice tone="problem">{problem}</SettingsNotice>}
      <section className="settings-group settings-group--danger">
        <h2>This cannot be undone</h2>
        <p>Deleting your account permanently removes:</p>
        <ul className="settings-bullets">
          <li>Every story you shared, published or not, with its photos, video and audio</li>
          <li>Your profile, photo, @username and level</li>
          <li>Who you follow, who follows you, and the Humans you love</li>
          <li>Notes sent to you and notes you sent</li>
        </ul>
        <p>We keep a small record of the permissions you gave for each story, so we can show that anything published was published with permission, as our <a href="/privacy">Privacy Policy</a> describes.</p>
        <form className="settings-form" action={deleteAccount}>
          <label htmlFor="delete-confirm">Type <b>{confirmWord}</b> to confirm</label>
          <input id="delete-confirm" name="confirm" autoComplete="off" autoCapitalize="none" spellCheck={false} required />
          <button className="ig-button ig-button--danger">Delete my account</button>
        </form>
      </section>
    </SettingsFrame>
  );
}

export default function DeleteAccountPage({ searchParams }: { searchParams: Search }) {
  return <Suspense fallback={<SettingsLoading />}><DeleteAccount searchParams={searchParams} /></Suspense>;
}
