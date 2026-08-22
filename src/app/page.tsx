import { FeaturedPerson } from "@/components/FeaturedPerson";
import { Footer } from "@/components/Footer";
import { GetInvolvedLinks } from "@/components/GetInvolvedLinks";
import { Header } from "@/components/Header";
import { Manifesto } from "@/components/Manifesto";
import { PortraitField } from "@/components/PortraitField";
import { DEV_FIXTURE_PEOPLE } from "@/data/people";

export default function Home() {
  const featured = DEV_FIXTURE_PEOPLE.find((person) => person.featured) ?? DEV_FIXTURE_PEOPLE[0];
  const archivePeople = DEV_FIXTURE_PEOPLE.filter((person) => person.slug !== featured.slug);

  return (
    <>
      <Header />
      <main id="main-content">
        <FeaturedPerson person={featured} />
        <PortraitField people={archivePeople} />
        <Manifesto />
        <GetInvolvedLinks compact />
      </main>
      <Footer />
    </>
  );
}
