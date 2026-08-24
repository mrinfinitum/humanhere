import Image from "next/image";
import Link from "next/link";
import type { HumanEntry } from "@/lib/archive/types";
import { resolveMediaUrl } from "@/lib/media/resolver";

export function StoryViewer({ entry, previous, next }: { entry: HumanEntry; previous?: HumanEntry; next?: HumanEntry }) {
  const identity = entry.person?.anonymous ? "Anonymous" : entry.person?.displayName ?? entry.headline ?? "Human";
  const imageAssets = [...(entry.thumbnail ? [entry.thumbnail] : []), ...(entry.media ?? [])].filter((asset, index, all) => asset.kind === "image" && all.findIndex(item => item.id === asset.id) === index);
  return <main className="story-viewer">
    <header><Link href="/humans" scroll={false}>← Archive</Link><Link className="story-mark" href="/">HUMAN<span>:</span>HERE</Link><Link href="/share">Be seen →</Link></header>
    <article>
      <section className="story-intro"><p className="eyebrow">{entry.type}</p><h1>{identity}</h1>{entry.person?.location && <p>{entry.person.location}</p>}{entry.headline && <h2>{entry.headline}</h2>}{entry.quote && <blockquote>“{entry.quote}”</blockquote>}</section>
      {imageAssets[0] && <figure className="story-primary"><Image src={resolveMediaUrl(imageAssets[0])} alt={imageAssets[0].alt} fill priority sizes="100vw" style={{ objectPosition: imageAssets[0].objectPosition }} />{imageAssets[0].caption && <figcaption>{imageAssets[0].caption}</figcaption>}</figure>}
      {entry.blocks?.map(block => block.type === "text" ? <section className="story-copy" key={block.id}>{block.heading && <h2>{block.heading}</h2>}{block.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section> : block.type === "quote" ? <blockquote className="story-quote" key={block.id}>“{block.quote}”</blockquote> : block.type === "note" ? <aside className="story-note" key={block.id}><p>{block.text}</p>{block.attribution && <small>{block.attribution}</small>}</aside> : null)}
      {!entry.blocks?.length && entry.story && <section className="story-copy"><p>{entry.story}</p></section>}
      {imageAssets.slice(1).map(asset => <figure className="story-secondary" key={asset.id}><Image src={resolveMediaUrl(asset)} alt={asset.alt} fill sizes="(max-width: 720px) 100vw, 70vw" />{asset.caption && <figcaption>{asset.caption}</figcaption>}</figure>)}
      {(entry.media ?? []).filter(asset => asset.kind === "audio").map(asset => <section className="story-audio" key={asset.id}><p>Listen</p><audio controls preload="metadata" src={resolveMediaUrl(asset)} />{asset.transcript && <details><summary>Transcript</summary><p>{asset.transcript}</p></details>}</section>)}
      {(entry.media ?? []).filter(asset => asset.kind === "video").map(asset => <figure className="story-video" key={asset.id}><video controls preload="metadata" poster={asset.poster}><source src={resolveMediaUrl(asset)} type={asset.mimeType} />{asset.transcript}</video>{asset.transcript && <figcaption>{asset.transcript}</figcaption>}</figure>)}
    </article>
    <nav className="story-next" aria-label="More humans">{previous ? <Link href={`/humans/${previous.slug}`}><span>Previous</span>{previous.person?.displayName ?? previous.headline ?? "Human"}</Link> : <span />}{next ? <Link href={`/humans/${next.slug}`}><span>Meet another human</span>{next.person?.displayName ?? next.headline ?? "Human"} →</Link> : <Link href="/humans"><span>Continue</span>More humans →</Link>}</nav>
  </main>;
}
