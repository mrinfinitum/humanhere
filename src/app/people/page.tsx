import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PortraitField } from "@/components/PortraitField";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

export const metadata: Metadata = {
  title: "People",
  description: "Meet the people whose real stories form the HUMAN:HERE archive.",
};

export default function PeoplePage() {
  return (
    <>
      <Header />
      <main id="main-content" className="archive-page">
        <header className="page-intro page-intro--archive">
          <p>Human archive / Development fixtures</p>
          <h1>People<span>.</span></h1>
          <div><p>Everyone has a story.</p><p>You cannot always tell what someone is carrying.</p></div>
        </header>
        <PortraitField people={DEV_FIXTURE_PEOPLE} showIntro={false} />
      </main>
      <Footer />
    </>
  );
}
