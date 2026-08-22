import type { Metadata } from "next";
import Link from "next/link";
import { EditorialShell } from "@/components/EditorialShell";
import { PanelFooter } from "@/components/PanelFooter";

export const metadata: Metadata = { title: "Give", description: "Support HUMAN:HERE and help people show up for people." };

export default function GivePage() {
  return (
    <EditorialShell current="Give">
      <article className="panel-document">
        <header className="document-header"><p>Participate</p><h1>Give</h1></header>
        <section className="panel-introduction"><p>Help someone show up. We are preparing a secure giving experience.</p><p><Link href="mailto:hello@humanhere.co?subject=I want to give">Start a conversation ↗</Link></p></section>
        <PanelFooter />
      </article>
    </EditorialShell>
  );
}
