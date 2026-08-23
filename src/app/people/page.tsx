import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { PeopleGrid } from "@/components/PeopleGrid";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "People", description: "Meet the people whose stories form the HUMAN:HERE archive." };

export default function PeoplePage() {
  return <><main><PageHero eyebrow="People" title="Every person carries a story." image="/images/hero-maya.jpg" imageAlt="Portrait fixture" imagePosition="center 38%" />
    <section className="editorial-intro shell"><p className="eyebrow">The human archive</p><h2>A name and a face can change the distance between us.</h2><div><p>These are development fixtures awaiting real, consented stories and commissioned photography.</p><p>Every public story will be created with the person featured and shared only with their approval.</p></div></section>
    <section className="people-index shell"><PeopleGrid /></section>
  </main><SiteFooter /></>;
}
