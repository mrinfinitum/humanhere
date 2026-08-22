import type { Metadata } from "next";
import Link from "next/link";
import { EditorialShell } from "@/components/EditorialShell";
import { PanelFooter } from "@/components/PanelFooter";

export const metadata: Metadata = { title: "Contact", description: "Contact HUMAN:HERE." };

export default function ContactPage() {
  return (
    <EditorialShell current="Contact">
      <article className="panel-document">
        <header className="document-header"><p>Connect</p><h1>Let&apos;s talk</h1></header>
        <section className="panel-introduction"><p>Tulsa, Oklahoma</p><p><Link href="mailto:hello@humanhere.co">hello@humanhere.co ↗</Link></p></section>
        <PanelFooter />
      </article>
    </EditorialShell>
  );
}
