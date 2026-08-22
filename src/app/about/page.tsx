import type { Metadata } from "next";
import { EditorialShell } from "@/components/EditorialShell";
import { PanelFooter } from "@/components/PanelFooter";

export const metadata: Metadata = { title: "About", description: "Why HUMAN:HERE exists: people still have to show up for people." };

export default function AboutPage() {
  return (
    <EditorialShell current="About">
      <article className="panel-document">
        <header className="document-header"><p>About</p><h1>People need people</h1></header>
        <section className="panel-introduction"><p>Technology can connect us. Systems can support us. But people still have to show up.</p></section>
        <section className="panel-section prose-section"><h2>Why we exist</h2><p>HUMAN:HERE brings people and organizations together to meet real needs with dignity, compassion, and presence.</p><p>We begin with people—not programs, labels, or statistics. A name and a story can change the distance between us.</p></section>
        <section className="panel-section prose-section"><h2>Why we show up</h2><p>Jesus taught us to see people others pass by, love our neighbors, and serve with humility.</p><p>Our faith is why we act. Our help is offered with dignity and without condition.</p></section>
        <PanelFooter />
      </article>
    </EditorialShell>
  );
}
