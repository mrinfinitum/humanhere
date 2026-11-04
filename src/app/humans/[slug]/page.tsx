import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StoryViewer } from "@/components/archive/StoryViewer";
import { getPublishedHumanBySlug, humanArchiveRepository } from "@/lib/archive/repository";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPublishedHumanBySlug(slug);
  if (!entry) return { title: "Human not found" };
  const name = entry.person?.anonymous ? "Anonymous" : entry.person?.displayName ?? entry.headline ?? "A human story";
  const description = entry.quote ?? entry.headline ?? entry.story?.slice(0, 155) ?? "A human story from HUMAN:HERE.";
  // The share card image comes from ./opengraph-image.tsx.
  return {
    title: name,
    description,
    alternates: { canonical: `/humans/${entry.slug}` },
    openGraph: { title: name, description, url: `/humans/${entry.slug}`, type: "article", publishedTime: entry.publishedAt },
    twitter: { card: "summary_large_image", title: name, description },
  };
}

async function HumanContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getPublishedHumanBySlug(slug);
  if (!entry) notFound();
  const { previous, next } = await humanArchiveRepository.getPublishedAdjacent(slug);
  return <StoryViewer entry={entry} previous={previous} next={next} />;
}

export default function HumanPage({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<main className="story-viewer"><p>Opening a human story…</p></main>}><HumanContent params={params} /></Suspense>;
}
