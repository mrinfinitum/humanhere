import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Get Involved", description: "Give, volunteer, partner, or pray with HUMAN:HERE." };
const actions = [{n:"01",title:"Give",text:"Support practical care and the work required to do it with dignity.",href:"/give"},{n:"02",title:"Volunteer",text:"Offer your time, attention, skills, and steady presence.",href:"/contact?interest=volunteer"},{n:"03",title:"Partner",text:"Bring your church, business, or organization into the work.",href:"/contact?interest=partner"},{n:"04",title:"Pray",text:"Stand with people and the community forming around them.",href:"/contact?interest=pray"}];
export default function GetInvolvedPage() { return <><main><PageHero eyebrow="Get involved" title="Choose to show up." image="/images/community-table.jpg" imageAlt="People sharing a meal" />
  <section className="editorial-intro shell"><p className="eyebrow">Participate</p><h2>Presence takes many forms. Choose where you can begin.</h2><div><p>You do not need to solve everything. You can offer one faithful next step.</p></div></section>
  <section className="action-cards shell">{actions.map(action => <Link href={action.href} key={action.title}><small>{action.n}</small><h3>{action.title}</h3><p>{action.text}</p><span>↗</span></Link>)}</section>
  <section className="promise-section"><div className="shell"><p className="eyebrow">Begin nearby</p><blockquote>The most human thing we can do is notice who is already in front of us.</blockquote><Link href="/contact" className="round-link" aria-label="Contact us">↗</Link></div></section>
  </main><SiteFooter /></>; }
