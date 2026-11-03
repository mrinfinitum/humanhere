import Link from "next/link";
import type { ReactNode } from "react";
import { MemberHeader } from "../MemberHeader";

export const SETTINGS_SECTIONS = [
  ["/account/settings/profile", "Edit profile", "Photo, name, bio and @username"],
  ["/account/settings/account", "Account", "Email, password and signed-in devices"],
  ["/account/settings/privacy", "Privacy & sharing", "Who sees what, and your story permissions"],
  ["/account/settings/content", "Your content & removal", "Edit, unpublish or remove your stories"],
] as const;

/**
 * One settings screen: a back link, a title and its content. On wide screens
 * section pages also get the list of sections beside them, like a desktop app.
 */
export function SettingsFrame({ role, title, current, back = "/account/settings", backLabel = "Settings", children }: {
  role: string; title: string; current?: string; back?: string; backLabel?: string; children: ReactNode;
}) {
  return (
    <main className="member-shell account-page">
      <div className="member-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <MemberHeader role={role} />
      <div className={`settings-shell${current ? " settings-shell--split" : ""}`}>
        {current && (
          <aside className="settings-side" aria-label="Settings sections">
            <p>Settings</p>
            <nav>{SETTINGS_SECTIONS.map(([href, label]) => <Link key={href} href={href} aria-current={href === current ? "page" : undefined}>{label}</Link>)}
              <Link className="settings-danger" href="/account/settings/delete" aria-current={current === "/account/settings/delete" ? "page" : undefined}>Delete account</Link>
            </nav>
            <Link className="settings-side__back" href="/account">← Back to profile</Link>
          </aside>
        )}
        <div className="settings-main">
          <Link className="settings-back" href={back}><span aria-hidden="true">←</span> {backLabel}</Link>
          <h1>{title}</h1>
          {children}
        </div>
      </div>
      <footer className="member-footer"><span><i aria-hidden="true" /> People need people.</span><small><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></small></footer>
    </main>
  );
}

export function SettingsLoading() {
  return <main className="member-shell member-loading"><span>HUMAN<i>:</i>HERE</span><b>Opening your settings</b></main>;
}

/** A short confirmation or problem message at the top of a settings screen. */
export function SettingsNotice({ tone = "done", children }: { tone?: "done" | "problem"; children: ReactNode }) {
  return <p className={`settings-notice settings-notice--${tone}`} role={tone === "problem" ? "alert" : "status"}>{children}</p>;
}
