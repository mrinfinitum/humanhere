import type { ReactNode } from "react";
import { HumanField } from "./HumanField";
import { SiteMenu } from "./SiteMenu";

type EditorialShellProps = {
  current: string;
  children: ReactNode;
  activeSlug?: string;
};

export function EditorialShell({ current, children, activeSlug }: EditorialShellProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteMenu current={current} />
      <HumanField activeSlug={activeSlug} />
      <main id="main-content" className="reading-panel">
        <div className="reading-panel__inner">{children}</div>
      </main>
      <div className="panel-handle" aria-hidden="true" />
    </>
  );
}
