import type { Metadata } from "next";
import { ArchiveRows } from "@/components/ArchiveRows";
import { EditorialShell } from "@/components/EditorialShell";
import { PanelFooter } from "@/components/PanelFooter";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

export const metadata: Metadata = { title: "People", description: "Meet the people whose real stories form the HUMAN:HERE archive." };

export default function PeoplePage() {
  return (
    <EditorialShell current="People">
      <article className="panel-document">
        <header className="document-header"><p>Archive</p><h1>People</h1></header>
        <section className="panel-introduction"><p>Every person has a name, a face, a story, dignity, and worth.</p><p>You cannot always tell what someone is carrying.</p></section>
        <section className="panel-section"><h2>Current entries</h2><p className="section-description">Development fixtures awaiting real, consented stories and photography.</p><ArchiveRows people={DEV_FIXTURE_PEOPLE} /></section>
        <PanelFooter />
      </article>
    </EditorialShell>
  );
}
