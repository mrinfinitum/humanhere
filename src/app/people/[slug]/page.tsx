import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorialShell } from "@/components/EditorialShell";
import { PanelFooter } from "@/components/PanelFooter";
import { DEV_FIXTURE_PEOPLE, getAdjacentPeople, getPerson } from "@/data/people";

type StoryPageProps = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return DEV_FIXTURE_PEOPLE.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const person = getPerson((await params).slug);
  return person ? { title: person.firstName, description: person.story, openGraph: { images: [{ url: person.portrait, alt: person.portraitAlt }] } } : {};
}

export default async function PersonStoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();
  const { previous, next } = getAdjacentPeople(slug);

  return (
    <EditorialShell current={person.firstName} activeSlug={slug}>
      <article className="panel-document story-document">
        <header className="document-header"><p>Person / Development fixture</p><h1>{person.firstName}</h1></header>
        <dl className="story-meta">
          <div><dt>Place</dt><dd>{person.location}</dd></div>
          <div><dt>Year</dt><dd>{person.publishedAt}</dd></div>
          <div><dt>Image</dt><dd>{person.photographer}</dd></div>
          <div><dt>Kind</dt><dd>Human story</dd></div>
        </dl>
        <blockquote className="story-quote">“{person.pullQuote}”</blockquote>
        <figure className="panel-portrait"><Image src={person.portrait} alt={person.portraitAlt} width={1024} height={1536} priority style={{ objectPosition: person.portraitPosition }} /></figure>
        <aside className="fixture-callout">Development fixture. Final words and photography require the featured person&apos;s consent and approval.</aside>
        {person.storySections?.map((section) => <section className="story-copy" key={section.heading}><h2>{section.heading}</h2>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
        <nav className="story-navigation" aria-label="More people">
          {previous && <Link href={`/people/${previous.slug}`}>← Meet {previous.firstName}</Link>}
          {next && <Link href={`/people/${next.slug}`}>Meet {next.firstName} →</Link>}
        </nav>
        <PanelFooter />
      </article>
    </EditorialShell>
  );
}
