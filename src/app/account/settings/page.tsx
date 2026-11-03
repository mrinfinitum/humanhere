import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOut } from "@/app/login/actions";
import { Avatar } from "@/components/Avatar";
import { getAccountRole, requireMember } from "@/lib/auth/server";
import { getAccountActivity } from "@/lib/account/queries";
import { SETTINGS_SECTIONS, SettingsFrame, SettingsLoading } from "./SettingsFrame";

async function SettingsHome() {
  await connection();
  const user = await requireMember("/account/settings");
  const [role, activity] = await Promise.all([getAccountRole(user.id), getAccountActivity(user.id)]);
  const name = activity.displayName?.trim() || user.name?.trim() || user.email.split("@")[0];
  return (
    <SettingsFrame role={role} title="Settings" back="/account" backLabel="Profile">
      <Link className="settings-me" href="/account/settings/profile">
        <Avatar name={name} path={activity.avatarPath} size={56} />
        <span><b>{name}</b><small>{activity.username ? `@${activity.username}` : user.email}</small></span>
        <i aria-hidden="true">›</i>
      </Link>
      <nav className="settings-list settings-list--grid" aria-label="Settings sections">
        {SETTINGS_SECTIONS.map(([href, label, detail]) => <Link key={href} href={href}><span><b>{label}</b><small>{detail}</small></span><i aria-hidden="true">›</i></Link>)}
      </nav>
      <div className="settings-list settings-list--plain">
        <form action={signOut}><button>Sign out</button></form>
        <Link className="settings-danger" href="/account/settings/delete"><span><b>Delete account</b></span><i aria-hidden="true">›</i></Link>
      </div>
    </SettingsFrame>
  );
}

export default function SettingsPage() {
  return <Suspense fallback={<SettingsLoading />}><SettingsHome /></Suspense>;
}
