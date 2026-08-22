import type { Metadata } from "next";
import Link from "next/link";
import { EditorialShell } from "@/components/EditorialShell";
import { PanelFooter } from "@/components/PanelFooter";

export const metadata: Metadata = { title: "Get Involved", description: "Give, volunteer, partner, or pray with HUMAN:HERE." };

export default function GetInvolvedPage() {
  return (
    <EditorialShell current="Get involved">
      <article className="panel-document">
        <header className="document-header"><p>Participate</p><h1>Show up</h1></header>
        <section className="panel-introduction"><p>Presence takes many forms. Choose where you can begin.</p></section>
        <nav className="action-list action-list--large" aria-label="Ways to get involved">
          <Link href="/give"><span>Give</span><small>Support the work</small></Link>
          <Link href="/contact?interest=volunteer"><span>Volunteer</span><small>Offer your time</small></Link>
          <Link href="/contact?interest=partner"><span>Partner</span><small>Work together</small></Link>
          <Link href="/contact?interest=pray"><span>Pray</span><small>Stand with people</small></Link>
        </nav>
        <PanelFooter />
      </article>
    </EditorialShell>
  );
}
