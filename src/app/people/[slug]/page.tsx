import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PersonNavigation } from "@/components/PersonNavigation";
import { StoryBody } from "@/components/StoryBody";
import { StoryHero } from "@/components/StoryHero";
import { DEV_FIXTURE_PEOPLE, getAdjacentPeople, getPerson } from "@/data/people";

type StoryPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return DEV_FIXTURE_PEOPLE.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) return {};

  return {
    title: person.firstName,
    description: person.story,
    openGraph: { images: [{ url: person.portrait, alt: person.portraitAlt }] },
  };
}

export default async function PersonStoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();
  const { previous, next } = getAdjacentPeople(slug);

  return (
    <>
      <Header />
      <main id="main-content" className="story-page">
        <article>
          <StoryHero person={person} />
          <StoryBody person={person} />
        </article>
        <PersonNavigation previous={previous} next={next} />
      </main>
      <Footer />
    </>
  );
}
