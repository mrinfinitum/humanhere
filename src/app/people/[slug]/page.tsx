import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { DEV_FIXTURE_PEOPLE, getAdjacentPeople, getPerson } from "@/data/people";

type StoryPageProps = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return DEV_FIXTURE_PEOPLE.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> { const person = getPerson((await params).slug); return person ? { title: person.firstName, description: person.story } : {}; }

export default async function PersonStoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();
  const { previous, next } = getAdjacentPeople(slug);
  return <><SiteHeader /><main className="story-page">
    <header className="story-header shell"><div><p className="eyebrow">Person · Development fixture</p><h1>{person.firstName}</h1><p className="story-deck">{person.descriptor}</p></div><dl><div><dt>Place</dt><dd>{person.location}</dd></div><div><dt>Year</dt><dd>{person.publishedAt}</dd></div><div><dt>Image</dt><dd>{person.photographer}</dd></div></dl></header>
    <figure className="story-image"><Image src={person.portrait} alt={person.portraitAlt} fill priority sizes="100vw" style={{ objectPosition: person.portraitPosition }} /></figure>
    <article className="story-body shell"><aside><p>Development fixture</p><span>Final words and photography require the featured person&apos;s consent and approval.</span></aside><div><blockquote>“{person.pullQuote}”</blockquote>{person.storySections?.map(section => <section key={section.heading}><p className="eyebrow">{section.heading}</p>{section.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}</div></article>
    <nav className="story-next shell" aria-label="More people">{previous && <Link href={`/people/${previous.slug}`}><small>Previous</small><span>← {previous.firstName}</span></Link>}{next && <Link href={`/people/${next.slug}`}><small>Next</small><span>{next.firstName} →</span></Link>}</nav>
  </main><SiteFooter /></>;
}
