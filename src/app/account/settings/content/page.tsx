import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getAccountRole, requireMember } from "@/lib/auth/server";
import { SettingsFrame, SettingsLoading } from "../SettingsFrame";

async function ContentSettings() {
  await connection();
  const user = await requireMember("/account/settings/content");
  const role = await getAccountRole(user.id);
  return (
    <SettingsFrame role={role} current="/account/settings/content" title="Your content & removal">
      <nav className="settings-list" aria-label="Your content">
        <Link href="/account"><span><b>Edit, unpublish or delete a story</b><small>Open a story on your profile and choose Edit, Unpublish or Delete.</small></span><i aria-hidden="true">›</i></Link>
        <Link href="/remove-my-story"><span><b>Ask us to remove something</b><small>For a story about you that someone else shared, or anything you cannot remove yourself.</small></span><i aria-hidden="true">›</i></Link>
        <Link href="/account?tab=notes"><span><b>Notes sent to you</b><small>Hide or report a note.</small></span><i aria-hidden="true">›</i></Link>
      </nav>
      <nav className="settings-list" aria-label="Policies">
        <Link href="/terms"><span><b>Terms of Use</b></span><i aria-hidden="true">›</i></Link>
        <Link href="/privacy"><span><b>Privacy Policy</b></span><i aria-hidden="true">›</i></Link>
      </nav>
    </SettingsFrame>
  );
}

export default function ContentSettingsPage() {
  return <Suspense fallback={<SettingsLoading />}><ContentSettings /></Suspense>;
}
